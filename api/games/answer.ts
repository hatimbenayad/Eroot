import type { VercelRequest, VercelResponse } from '@vercel/node';
import { submitAnswerRequestSchema } from '../../shared/schemas/game';
import type { SlideDraft } from '../../shared/schemas/slide';
import { evaluateSlideAnswer } from '../../shared/scoring/scoring';
import type { DbGameRow, DbPlayerRow } from '../_lib/game-helpers';
import {
  broadcastGameEvent,
  enforceRateLimit,
  getAdminClient,
  getClientIp,
  sendError,
} from '../_lib/supabase-admin';

const CLOCK_GRACE_MS = 500;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Use POST.');
    return;
  }

  const parsed = submitAnswerRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'INVALID_REQUEST', parsed.error.issues[0]?.message ?? 'Invalid answer payload.');
    return;
  }

  const tokenHeader = req.headers['x-player-token'];
  const sessionToken = typeof tokenHeader === 'string' ? tokenHeader.trim() : '';
  if (!sessionToken) {
    sendError(res, 401, 'UNAUTHORIZED', 'Player session token is required.');
    return;
  }

  const supabase = getAdminClient();
  const ip = getClientIp(req);
  const allowed = await enforceRateLimit(supabase, `answer:${ip}:${parsed.data.gameId}`, 30, 60);
  if (!allowed) {
    sendError(res, 429, 'RATE_LIMITED', 'Slow down answer submissions.');
    return;
  }

  const { gameId, slideId, optionId, optionIds, text, value, order } = parsed.data;
  const submission = { optionId, optionIds, text, value, order };

  const { data: playerData } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .eq('session_token', sessionToken)
    .maybeSingle();

  if (!playerData) {
    sendError(res, 401, 'INVALID_SESSION', 'Player session not found.');
    return;
  }

  const player = playerData as DbPlayerRow;
  if (player.is_kicked) {
    sendError(res, 403, 'PLAYER_KICKED', 'You were removed from this game.');
    return;
  }

  const { data: gameData } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (!gameData) {
    sendError(res, 404, 'GAME_NOT_FOUND', 'Game not found.');
    return;
  }

  const game = gameData as DbGameRow;
  if (game.state !== 'question_active' || !game.question_started_at) {
    sendError(res, 409, 'QUESTION_CLOSED', 'Answers are not open right now.');
    return;
  }

  const { data: snapData } = await supabase
    .from('game_snapshots')
    .select('authoritative_slides')
    .eq('game_id', gameId)
    .single();

  const authSlides = (snapData?.authoritative_slides ?? []) as SlideDraft[];
  const activeSlide = authSlides[game.current_slide_index];
  if (!activeSlide || activeSlide.id !== slideId) {
    sendError(res, 409, 'SLIDE_MISMATCH', 'Submitted answer does not match the active question.');
    return;
  }

  const nowMs = Date.now();
  const startedMs = Date.parse(game.question_started_at);
  const rawResponseMs = Math.max(0, nowMs - startedMs);
  const questionMs = activeSlide.timeLimit * 1000;

  if (rawResponseMs > questionMs + CLOCK_GRACE_MS) {
    sendError(res, 409, 'TIME_EXPIRED', 'Time for this question has expired.');
    return;
  }

  const evaluation = evaluateSlideAnswer(activeSlide, submission, rawResponseMs);
  if (!evaluation.validOption) {
    sendError(res, 400, 'INVALID_OPTION', 'Submitted answer does not match this slide.');
    return;
  }

  const { error: insertErr } = await supabase.from('answers').insert({
    game_id: gameId,
    player_id: player.id,
    slide_id: slideId,
    payload: submission,
    response_ms: Math.min(rawResponseMs, questionMs),
    points: evaluation.points,
    is_correct: evaluation.isCorrect,
  });

  if (insertErr) {
    if (insertErr.code === '23505') {
      sendError(res, 409, 'ALREADY_ANSWERED', 'You have already answered this question.');
      return;
    }
    sendError(res, 500, 'ANSWER_SAVE_FAILED', 'Could not save answer.');
    return;
  }

  await supabase.rpc('apply_player_answer_score', {
    p_player_id: player.id,
    p_points: evaluation.points,
    p_is_correct: evaluation.isCorrect,
  });

  const { count } = await supabase
    .from('answers')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .eq('slide_id', slideId);

  await broadcastGameEvent(supabase, gameId, 'answer_count', {
    slideId,
    count: count ?? 1,
  });

  // Never leak correctness or points before reveal
  res.status(201).json({ accepted: true, slideId });
}


import crypto from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { generateFriendlyNickname, isNicknameClean } from '../../shared/moderation/nickname';
import { submitAnswerRequestSchema, type GameOptions } from '../../shared/schemas/game';
import type { SlideDraft } from '../../shared/schemas/slide';
import { evaluateSlideAnswer } from '../../shared/scoring/scoring';
import type { DbGameRow, DbPlayerRow } from '../_lib/game-helpers';
import { enforceRateLimit, getAdminClient, getClientIp, sendError } from '../_lib/supabase-admin';

const challengeActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('join'),
    pin: z.string().trim().regex(/^\d{6,7}$/),
    nickname: z.string().trim().max(24).optional(),
    identifier: z.string().trim().max(80).optional(),
  }),
  z.object({
    action: z.literal('submit'),
    gameId: z.string().uuid(),
    slideId: z.string().min(1),
    optionId: z.string().min(1).optional(),
    optionIds: z.array(z.string().min(1)).min(1).max(6).optional(),
    text: z.string().trim().min(1).max(250).optional(),
    value: z.number().finite().optional(),
    order: z.array(z.string().min(1)).length(4).optional(),
    elapsedMs: z.number().min(0).max(600_000).default(0),
  }),
]);

function isChallengeClosed(game: DbGameRow): boolean {
  if (game.state === 'ended') return true;
  if (game.challenge_deadline && Date.now() > Date.parse(game.challenge_deadline)) {
    return true;
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const supabase = getAdminClient();

  if (req.method === 'GET') {
    const rawPin = typeof req.query.pin === 'string' ? req.query.pin.trim() : '';
    const rawId = typeof req.query.gameId === 'string' ? req.query.gameId.trim() : '';

    let query = supabase.from('games').select('*').eq('mode', 'challenge');
    if (rawId) query = query.eq('id', rawId);
    else if (rawPin) query = query.eq('pin', rawPin);
    else {
      sendError(res, 400, 'MISSING_PARAM', 'Provide pin or gameId.');
      return;
    }

    const { data: gameData, error } = await query.maybeSingle();
    if (error || !gameData) {
      sendError(res, 404, 'NOT_FOUND', 'Challenge not found.');
      return;
    }

    const game = gameData as DbGameRow;
    const tokenHeader = req.headers['x-player-token'];
    const token = typeof tokenHeader === 'string' ? tokenHeader.trim() : '';

    let playerSummary = null;
    let submittedSlideIds: string[] = [];

    if (token) {
      const { data: pData } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', game.id)
        .eq('session_token', token)
        .maybeSingle();

      if (pData) {
        const player = pData as DbPlayerRow;
        if (player.is_kicked) {
          sendError(res, 403, 'PLAYER_KICKED', 'You were removed from this challenge.');
          return;
        }
        const { data: pAnswers } = await supabase
          .from('answers')
          .select('slide_id')
          .eq('game_id', game.id)
          .eq('player_id', player.id);
        submittedSlideIds = (pAnswers ?? []).map((a) => (a as { slide_id: string }).slide_id);
        playerSummary = {
          id: player.id,
          nickname: player.nickname,
          totalScore: player.total_score,
          streak: player.streak,
        };
      }
    }

    res.status(200).json({
      challenge: {
        id: game.id,
        pin: game.pin,
        quizTitle: game.quiz_title,
        themeId: game.theme_id,
        slides: game.public_slides,
        deadline: game.challenge_deadline,
        timerEnabled: Boolean(game.challenge_timer_enabled),
        accuracyOnly: Boolean(game.challenge_accuracy_only),
        closed: isChallengeClosed(game),
        requirePlayerIdentifier: Boolean(game.settings.requirePlayerIdentifier),
        playerIdentifierLabel: game.settings.playerIdentifierLabel || 'Full name or ID',
        friendlyNicknames: Boolean(game.settings.friendlyNicknames),
      },
      player: playerSummary,
      submittedSlideIds,
    });
    return;
  }

  if (req.method === 'POST') {
    const parsed = challengeActionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, 'INVALID_REQUEST', parsed.error.issues[0]?.message ?? 'Invalid input.');
      return;
    }

    const ip = getClientIp(req);
    const allowed = await enforceRateLimit(supabase, `challenge:${ip}`, 30, 60);
    if (!allowed) {
      sendError(res, 429, 'RATE_LIMITED', 'Too many requests. Wait a moment.');
      return;
    }

    if (parsed.data.action === 'join') {
      const { pin, nickname, identifier } = parsed.data;
      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('pin', pin)
        .eq('mode', 'challenge')
        .maybeSingle();

      if (!gameData) {
        sendError(res, 404, 'NOT_FOUND', 'Challenge not found.');
        return;
      }

      const game = gameData as DbGameRow;
      if (isChallengeClosed(game)) {
        sendError(res, 409, 'CHALLENGE_CLOSED', 'This challenge is closed or past its deadline.');
        return;
      }

      const settings = (game.settings ?? {}) as GameOptions;
      if (settings.requirePlayerIdentifier && !identifier?.trim()) {
        sendError(res, 400, 'IDENTIFIER_REQUIRED', 'Player identifier is required.');
        return;
      }

      const { count } = await supabase
        .from('players')
        .select('id', { count: 'exact', head: true })
        .eq('game_id', game.id)
        .eq('is_kicked', false);

      if ((count ?? 0) >= game.max_players) {
        sendError(res, 409, 'CHALLENGE_FULL', 'Participant cap reached.');
        return;
      }

      const finalNickname = settings.friendlyNicknames
        ? generateFriendlyNickname((count ?? 0) + 1)
        : (nickname?.trim() ?? '');

      if (!isNicknameClean(finalNickname)) {
        sendError(res, 400, 'INVALID_NICKNAME', 'Choose a clean nickname (1–24 chars).');
        return;
      }

      const sessionToken = crypto.randomUUID();
      const { data: player, error: insErr } = await supabase
        .from('players')
        .insert({
          game_id: game.id,
          nickname: finalNickname,
          identifier: identifier?.trim() || null,
          session_token: sessionToken,
        })
        .select('*')
        .single();

      if (insErr || !player) {
        if (insErr?.code === '23505') {
          sendError(res, 409, 'NICKNAME_TAKEN', 'Nickname already used in this challenge.');
          return;
        }
        sendError(res, 500, 'JOIN_FAILED', 'Unable to join challenge.');
        return;
      }

      res.status(201).json({
        gameId: game.id,
        playerId: player.id,
        sessionToken,
        nickname: player.nickname,
      });
      return;
    }

    // Submit self-paced answer
    const subCheck = submitAnswerRequestSchema.safeParse(parsed.data);
    if (!subCheck.success) {
      sendError(res, 400, 'INVALID_ANSWER', subCheck.error.issues[0]?.message ?? 'Invalid answer.');
      return;
    }

    const tokenHeader = req.headers['x-player-token'];
    const token = typeof tokenHeader === 'string' ? tokenHeader.trim() : '';
    if (!token) {
      sendError(res, 401, 'UNAUTHORIZED', 'Missing session token.');
      return;
    }

    const { gameId, slideId, elapsedMs } = parsed.data;
    const { data: gameData } = await supabase.from('games').select('*').eq('id', gameId).single();
    if (!gameData) {
      sendError(res, 404, 'NOT_FOUND', 'Challenge not found.');
      return;
    }
    const game = gameData as DbGameRow;
    if (isChallengeClosed(game)) {
      sendError(res, 409, 'CHALLENGE_CLOSED', 'This challenge has ended or passed its deadline.');
      return;
    }

    const { data: pData } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('session_token', token)
      .maybeSingle();

    if (!pData) {
      sendError(res, 401, 'INVALID_SESSION', 'Session not found.');
      return;
    }
    const player = pData as DbPlayerRow;
    if (player.is_kicked) {
      sendError(res, 403, 'PLAYER_KICKED', 'You were removed from this challenge.');
      return;
    }

    const { data: snapData } = await supabase
      .from('game_snapshots')
      .select('authoritative_slides')
      .eq('game_id', gameId)
      .single();

    const slides = (snapData?.authoritative_slides ?? []) as SlideDraft[];
    const slide = slides.find((s) => s.id === slideId);
    if (!slide) {
      sendError(res, 404, 'SLIDE_NOT_FOUND', 'Slide not found.');
      return;
    }

    const submission = {
      optionId: parsed.data.optionId,
      optionIds: parsed.data.optionIds,
      text: parsed.data.text,
      value: parsed.data.value,
      order: parsed.data.order,
    };

    const evalRes = evaluateSlideAnswer(slide, submission, elapsedMs, {
      accuracyOnly: Boolean(game.challenge_accuracy_only),
    });

    if (!evalRes.validOption) {
      sendError(res, 400, 'INVALID_OPTION', 'Invalid answer payload.');
      return;
    }

    const { error: ansErr } = await supabase.from('answers').insert({
      game_id: gameId,
      player_id: player.id,
      slide_id: slideId,
      payload: submission,
      response_ms: Math.min(elapsedMs, slide.timeLimit * 1000),
      points: evalRes.points,
      is_correct: evalRes.isCorrect,
    });

    if (ansErr) {
      if (ansErr.code === '23505') {
        sendError(res, 409, 'ALREADY_ANSWERED', 'Question already submitted.');
        return;
      }
      sendError(res, 500, 'SAVE_FAILED', 'Unable to save answer.');
      return;
    }

    await supabase.rpc('apply_player_answer_score', {
      p_player_id: player.id,
      p_points: evalRes.points,
      p_is_correct: evalRes.isCorrect,
    });

    res.status(201).json({
      accepted: true,
      isCorrect: evalRes.isCorrect,
      pointsEarned: evalRes.points,
      totalScore: player.total_score + evalRes.points,
    });
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
}


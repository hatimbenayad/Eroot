import type { VercelRequest, VercelResponse } from '@vercel/node';
import { submitAnswerRequestSchema, type AnswerSubmissionPayload, type RevealPayload } from '../../shared/schemas/game';
import type { BrainstormContent, SlideDraft } from '../../shared/schemas/slide';
import { aggregateBrainstormIdeas, evaluateSlideAnswer } from '../../shared/scoring/scoring';
import { buildPublicGamePayload, type DbGameRow, type DbPlayerRow } from '../_lib/game-helpers';
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

  const { gameId, slideId, optionId, optionIds, text, value, order, pin, brainstormAction, votedIdeaIds } =
    parsed.data;
  const submission: AnswerSubmissionPayload = {
    optionId,
    optionIds,
    text,
    value,
    order,
    pin,
    brainstormAction,
    votedIdeaIds,
  };

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

  // Two-phase Brainstorm voting during question_reveal
  if (
    game.state === 'question_reveal' &&
    activeSlide.type === 'brainstorm' &&
    brainstormAction === 'vote_idea'
  ) {
    const pickedVotes = Array.from(new Set(votedIdeaIds ?? [])).slice(0, 3);
    const { data: existingRow } = await supabase
      .from('answers')
      .select('payload')
      .eq('game_id', gameId)
      .eq('player_id', player.id)
      .eq('slide_id', slideId)
      .maybeSingle();

    const prevPayload = (existingRow?.payload ?? {}) as AnswerSubmissionPayload;
    const mergedPayload: AnswerSubmissionPayload = {
      ...prevPayload,
      votedIdeaIds: pickedVotes,
    };

    const { error: voteErr } = await supabase.from('answers').upsert(
      {
        game_id: gameId,
        player_id: player.id,
        slide_id: slideId,
        payload: mergedPayload,
        response_ms: 0,
        points: 0,
        is_correct: null,
      },
      { onConflict: 'game_id,player_id,slide_id' }
    );

    if (voteErr) {
      sendError(res, 500, 'VOTE_SAVE_FAILED', 'Could not save Brainstorm vote.');
      return;
    }

    const [{ data: allAns }, { data: allPlayers }] = await Promise.all([
      supabase.from('answers').select('player_id, payload').eq('game_id', gameId).eq('slide_id', slideId),
      supabase.from('players').select('*').eq('game_id', gameId).eq('is_kicked', false),
    ]);

    const activePlayers = (allPlayers ?? []) as DbPlayerRow[];
    const nickMap = new Map(activePlayers.map((p) => [p.id, p.nickname]));
    const brainstormIdeas = aggregateBrainstormIdeas(
      (allAns ?? []).map((r) => ({
        playerId: (r as { player_id: string }).player_id,
        nickname: nickMap.get((r as { player_id: string }).player_id),
        payload: ((r as { payload?: AnswerSubmissionPayload }).payload ?? {}) as AnswerSubmissionPayload,
      }))
    );

    const updatedReveal: RevealPayload = {
      ...(game.reveal_payload ?? {
        slideId,
        correctOptionIds: [],
        optionCounts: {},
        totalAnswers: brainstormIdeas.length,
      }),
      brainstormIdeas,
    };

    const { data: updatedGameData } = await supabase
      .from('games')
      .update({ reveal_payload: updatedReveal })
      .eq('id', gameId)
      .select('*')
      .single();

    if (updatedGameData) {
      const publicGame = buildPublicGamePayload(
        updatedGameData as DbGameRow,
        activePlayers,
        updatedReveal.totalAnswers
      );
      await broadcastGameEvent(supabase, gameId, 'game_state', { game: publicGame });
    }

    res.status(200).json({ accepted: true, slideId });
    return;
  }

  if (game.state !== 'question_active' || !game.question_started_at) {
    sendError(res, 409, 'QUESTION_CLOSED', 'Answers are not open right now.');
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

  // Two-phase Brainstorm idea submission (up to 3 ideas per player during question_active)
  if (activeSlide.type === 'brainstorm') {
    const trimmedIdea = (text ?? '').trim().slice(0, 80);
    if (!trimmedIdea) {
      sendError(res, 400, 'INVALID_OPTION', 'Enter an idea up to 80 characters.');
      return;
    }

    const maxIdeas = (activeSlide.content as BrainstormContent).maxIdeasPerPlayer ?? 3;
    const { data: existingRow } = await supabase
      .from('answers')
      .select('id, payload')
      .eq('game_id', gameId)
      .eq('player_id', player.id)
      .eq('slide_id', slideId)
      .maybeSingle();

    if (existingRow) {
      const prev = (existingRow.payload ?? {}) as AnswerSubmissionPayload;
      const existingIdeas = Array.isArray(prev.ideas)
        ? prev.ideas
        : prev.text?.trim()
          ? [prev.text.trim()]
          : [];
      if (existingIdeas.length >= maxIdeas) {
        sendError(res, 409, 'IDEA_LIMIT_REACHED', `You can submit up to ${maxIdeas} ideas.`);
        return;
      }
      if (existingIdeas.some((i) => i.toLowerCase() === trimmedIdea.toLowerCase())) {
        sendError(res, 409, 'DUPLICATE_IDEA', 'You already submitted that idea.');
        return;
      }
      const nextIdeas = [...existingIdeas, trimmedIdea];
      await supabase
        .from('answers')
        .update({ payload: { ...prev, ideas: nextIdeas } })
        .eq('id', (existingRow as { id: string }).id);

      res.status(201).json({ accepted: true, slideId, ideasCount: nextIdeas.length });
      return;
    }

    const { error: insErr } = await supabase.from('answers').insert({
      game_id: gameId,
      player_id: player.id,
      slide_id: slideId,
      payload: { text: trimmedIdea, ideas: [trimmedIdea] },
      response_ms: Math.min(rawResponseMs, questionMs),
      points: 0,
      is_correct: null,
    });
    if (insErr) {
      sendError(res, 500, 'ANSWER_SAVE_FAILED', 'Could not save idea.');
      return;
    }
    const { count } = await supabase
      .from('answers')
      .select('id', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .eq('slide_id', slideId);
    await broadcastGameEvent(supabase, gameId, 'answer_count', {
      slideId,
      count: count ?? 1,
    });
    res.status(201).json({ accepted: true, slideId, ideasCount: 1 });
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


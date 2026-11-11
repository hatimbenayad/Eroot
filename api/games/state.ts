import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hostStateActionSchema, type AnswerSubmissionPayload, type RevealPayload } from '../../shared/schemas/game';
import type {
  PinAnswerContent,
  PuzzleContent,
  QuizContent,
  SlideDraft,
  SliderContent,
  TypeAnswerContent,
} from '../../shared/schemas/slide';
import { aggregateBrainstormIdeas, calculateNpsScore } from '../../shared/scoring/scoring';
import {
  InvalidGameTransitionError,
  transitionGameState,
} from '../../shared/state-machine/game-state';
import {
  buildPublicGamePayload,
  type DbGameRow,
  type DbPlayerRow,
  type DbTeamRow,
} from '../_lib/game-helpers';
import type { TeamAnswerRef } from '../../shared/scoring/team';
import {
  broadcastGameEvent,
  getAdminClient,
  requireHostUser,
  sendError,
} from '../_lib/supabase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Use POST.');
    return;
  }

  const parsed = hostStateActionSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'INVALID_REQUEST', parsed.error.issues[0]?.message ?? 'Invalid payload.');
    return;
  }

  const supabase = getAdminClient();
  const user = await requireHostUser(req, supabase);
  if (!user) {
    sendError(res, 401, 'UNAUTHORIZED', 'Host authentication required.');
    return;
  }

  const { gameId, action } = parsed.data;

  const { data: gameData, error: gameErr } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .eq('host_id', user.id)
    .single();

  if (gameErr || !gameData) {
    sendError(res, 404, 'GAME_NOT_FOUND', 'Game not found.');
    return;
  }

  const game = gameData as DbGameRow;

  const { data: snapData, error: snapErr } = await supabase
    .from('game_snapshots')
    .select('authoritative_slides')
    .eq('game_id', gameId)
    .single();

  if (snapErr || !snapData) {
    sendError(res, 500, 'SNAPSHOT_MISSING', 'Authoritative quiz snapshot missing.');
    return;
  }

  const authoritativeSlides = snapData.authoritative_slides as SlideDraft[];

  let transition;
  try {
    transition = transitionGameState(
      game.state,
      game.current_slide_index,
      authoritativeSlides,
      action
    );
  } catch (err) {
    if (err instanceof InvalidGameTransitionError) {
      sendError(res, 409, 'INVALID_TRANSITION', err.message);
      return;
    }
    throw err;
  }

  const nowIso = new Date().toISOString();
  const updatePatch: Record<string, unknown> = {
    state: transition.state,
    current_slide_index: transition.slideIndex,
  };

  if (game.state === 'lobby' && transition.state !== 'lobby') {
    updatePatch.started_at = nowIso;
  }

  if (transition.state === 'question_active') {
    updatePatch.question_started_at = nowIso;
    updatePatch.reveal_payload = null;
  } else if (transition.state === 'question_intro') {
    updatePatch.question_started_at = null;
    updatePatch.reveal_payload = null;
  }

  if (transition.state === 'question_reveal') {
    const authSlide = authoritativeSlides[transition.slideIndex];
    if (authSlide) {
      const { data: slideAnswers } = await supabase
        .from('answers')
        .select('player_id, payload, is_correct')
        .eq('game_id', gameId)
        .eq('slide_id', authSlide.id);

      const { data: rosterRows } = await supabase
        .from('players')
        .select('id, nickname')
        .eq('game_id', gameId);
      const nicknameById = new Map(
        (rosterRows ?? []).map((p) => [(p as { id: string }).id, (p as { nickname: string }).nickname])
      );

      const optionCounts: Record<string, number> = {};
      const numericCounts: Record<string, number> = {};
      const numericValues: number[] = [];
      const wordMap = new Map<string, number>();
      const openResponses: { nickname?: string; text: string }[] = [];
      const pinDrops: { x: number; y: number; isCorrect?: boolean | null; nickname?: string }[] = [];
      const brainstormRows: { playerId: string; nickname?: string; payload: AnswerSubmissionPayload }[] =
        [];

      for (const ans of slideAnswers ?? []) {
        const row = ans as {
          player_id: string;
          payload?: AnswerSubmissionPayload;
          is_correct?: boolean | null;
        };
        const p = row.payload ?? {};

        if (p.optionId) {
          optionCounts[p.optionId] = (optionCounts[p.optionId] ?? 0) + 1;
        }
        if (Array.isArray(p.optionIds)) {
          for (const oid of p.optionIds) {
            optionCounts[oid] = (optionCounts[oid] ?? 0) + 1;
          }
        }
        if (typeof p.value === 'number' && Number.isFinite(p.value)) {
          numericValues.push(p.value);
          const key = String(p.value);
          numericCounts[key] = (numericCounts[key] ?? 0) + 1;
        }
        if (typeof p.text === 'string' && p.text.trim()) {
          const trimmed = p.text.trim();
          const norm = trimmed.toLowerCase();
          wordMap.set(norm, (wordMap.get(norm) ?? 0) + 1);
          openResponses.push({
            nickname: nicknameById.get(row.player_id),
            text: trimmed,
          });
        }
        if (p.pin && typeof p.pin.x === 'number' && typeof p.pin.y === 'number') {
          pinDrops.push({
            x: p.pin.x,
            y: p.pin.y,
            isCorrect: row.is_correct ?? null,
            nickname: nicknameById.get(row.player_id),
          });
        }
        if (authSlide.type === 'brainstorm') {
          brainstormRows.push({
            playerId: row.player_id,
            nickname: nicknameById.get(row.player_id),
            payload: p,
          });
        }
      }

      const correctOptionIds =
        authSlide.type === 'quiz' || authSlide.type === 'true_false'
          ? (authSlide.content as QuizContent).options
              .filter((o) => o.isCorrect)
              .map((o) => o.id)
          : [];

      const mean =
        numericValues.length > 0
          ? Number(
              (numericValues.reduce((sum, n) => sum + n, 0) / numericValues.length).toFixed(2)
            )
          : null;

      const wordCounts = Array.from(wordMap.entries())
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count);

      const revealPayload: RevealPayload = {
        slideId: authSlide.id,
        correctOptionIds,
        optionCounts,
        totalAnswers: (slideAnswers ?? []).length,
        acceptedAnswers:
          authSlide.type === 'type_answer'
            ? (authSlide.content as TypeAnswerContent).acceptedAnswers.filter((a) => a.trim())
            : undefined,
        sliderTarget:
          authSlide.type === 'slider'
            ? {
                correctValue: (authSlide.content as SliderContent).correctValue,
                tolerance: (authSlide.content as SliderContent).tolerance,
                unit: (authSlide.content as SliderContent).unit,
              }
            : undefined,
        sliderValues: authSlide.type === 'slider' ? numericValues : undefined,
        puzzleSequence:
          authSlide.type === 'puzzle' ? (authSlide.content as PuzzleContent).items : undefined,
        numericCounts:
          authSlide.type === 'scale' || authSlide.type === 'nps_scale' ? numericCounts : undefined,
        scaleMean: authSlide.type === 'scale' || authSlide.type === 'slider' ? mean : undefined,
        npsScore: authSlide.type === 'nps_scale' ? calculateNpsScore(numericValues) : undefined,
        wordCounts:
          authSlide.type === 'word_cloud' || authSlide.type === 'type_answer'
            ? wordCounts
            : undefined,
        openResponses: authSlide.type === 'open_ended' ? openResponses : undefined,
        pinTarget:
          authSlide.type === 'pin_answer'
            ? (authSlide.content as PinAnswerContent).target
            : undefined,
        pinDrops:
          authSlide.type === 'pin_answer' || authSlide.type === 'drop_pin'
            ? pinDrops
            : undefined,
        brainstormIdeas:
          authSlide.type === 'brainstorm' ? aggregateBrainstormIdeas(brainstormRows) : undefined,
      };
      updatePatch.reveal_payload = revealPayload;
    }
  }

  if (transition.state === 'ended') {
    updatePatch.ended_at = nowIso;
  }

  const { data: updatedGameData, error: updateErr } = await supabase
    .from('games')
    .update(updatePatch)
    .eq('id', gameId)
    .select('*')
    .single();

  if (updateErr || !updatedGameData) {
    sendError(res, 500, 'STATE_UPDATE_FAILED', 'Unable to update game state.');
    return;
  }

  const updatedGame = updatedGameData as DbGameRow;

  const { data: playersData } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .eq('is_kicked', false);

  const activePlayers = (playersData ?? []) as DbPlayerRow[];

  if (transition.state === 'ended') {
    await supabase.from('reports').upsert(
      {
        game_id: gameId,
        host_id: user.id,
        title: updatedGame.quiz_title || 'Live Game Report',
        mode: updatedGame.mode === 'challenge' ? 'challenge' : 'live',
        summary_cache: {
          playerCount: activePlayers.length,
          questionCount: authoritativeSlides.length,
        },
      },
      { onConflict: 'game_id' }
    );
  }

  const currentSlide = updatedGame.public_slides[updatedGame.current_slide_index];
  let answerCount = 0;
  if (currentSlide && updatedGame.state === 'question_reveal' && updatedGame.reveal_payload) {
    answerCount = updatedGame.reveal_payload.totalAnswers;
  }

  let teams: DbTeamRow[] | undefined;
  let teamAnswers: TeamAnswerRef[] | undefined;
  if (updatedGame.mode === 'team') {
    const [{ data: teamRows }, { data: ansRows }] = await Promise.all([
      supabase.from('teams').select('*').eq('game_id', gameId).order('position', { ascending: true }),
      supabase.from('answers').select('player_id, slide_id, points').eq('game_id', gameId),
    ]);
    teams = (teamRows ?? []) as DbTeamRow[];
    teamAnswers = (ansRows ?? []) as TeamAnswerRef[];
  }

  const publicGame = buildPublicGamePayload(updatedGame, activePlayers, answerCount, {
    teams,
    answers: teamAnswers,
  });
  await broadcastGameEvent(supabase, gameId, 'game_state', { game: publicGame });

  res.status(200).json({ game: publicGame });
}


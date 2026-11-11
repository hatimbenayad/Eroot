import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hostStateActionSchema, type RevealPayload } from '../../shared/schemas/game';
import type { QuizContent, SlideDraft } from '../../shared/schemas/slide';
import {
  InvalidGameTransitionError,
  transitionGameState,
} from '../../shared/state-machine/game-state';
import { buildPublicGamePayload, type DbGameRow, type DbPlayerRow } from '../_lib/game-helpers';
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
        .select('payload')
        .eq('game_id', gameId)
        .eq('slide_id', authSlide.id);

      const optionCounts: Record<string, number> = {};
      for (const ans of slideAnswers ?? []) {
        const optionId = (ans as { payload?: { optionId?: string } }).payload?.optionId;
        if (optionId) {
          optionCounts[optionId] = (optionCounts[optionId] ?? 0) + 1;
        }
      }

      const correctOptionIds =
        authSlide.type === 'quiz' || authSlide.type === 'true_false'
          ? (authSlide.content as QuizContent).options
              .filter((o) => o.isCorrect)
              .map((o) => o.id)
          : [];

      const revealPayload: RevealPayload = {
        slideId: authSlide.id,
        correctOptionIds,
        optionCounts,
        totalAnswers: (slideAnswers ?? []).length,
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

  const publicGame = buildPublicGamePayload(updatedGame, activePlayers, answerCount);
  await broadcastGameEvent(supabase, gameId, 'game_state', { game: publicGame });

  res.status(200).json({ game: publicGame });
}

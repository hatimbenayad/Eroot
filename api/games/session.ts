import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { PlayerQuestionFeedback } from '../../shared/schemas/game';
import {
  buildPublicGamePayload,
  computeScoreboard,
  type DbGameRow,
  type DbPlayerRow,
} from '../_lib/game-helpers';
import { getAdminClient, requireHostUser, sendError } from '../_lib/supabase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Use GET.');
    return;
  }

  const gameId = typeof req.query.gameId === 'string' ? req.query.gameId.trim() : '';
  if (!gameId) {
    sendError(res, 400, 'MISSING_GAME_ID', 'gameId query parameter is required.');
    return;
  }

  const supabase = getAdminClient();
  const { data: gameData, error: gameErr } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .maybeSingle();

  if (gameErr || !gameData) {
    sendError(res, 404, 'GAME_NOT_FOUND', 'Game not found.');
    return;
  }

  const game = gameData as DbGameRow;

  const { data: playersData } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .eq('is_kicked', false);

  const activePlayers = (playersData ?? []) as DbPlayerRow[];
  const currentSlide = game.public_slides[game.current_slide_index];

  let answerCount = 0;
  if (currentSlide) {
    const { count } = await supabase
      .from('answers')
      .select('id', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .eq('slide_id', currentSlide.id);
    answerCount = count ?? 0;
  }

  const publicGame = buildPublicGamePayload(game, activePlayers, answerCount);

  // Check if host
  const hostUser = await requireHostUser(req, supabase);
  if (hostUser && hostUser.id === game.host_id) {
    res.status(200).json({
      role: 'host',
      game: publicGame,
      roster: activePlayers.map((p) => ({ id: p.id, nickname: p.nickname })),
    });
    return;
  }

  // Otherwise authenticate player via x-player-token header
  const playerTokenHeader = req.headers['x-player-token'];
  const playerToken = typeof playerTokenHeader === 'string' ? playerTokenHeader.trim() : '';
  if (!playerToken) {
    sendError(res, 401, 'UNAUTHORIZED', 'Missing session token.');
    return;
  }

  const { data: playerData } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .eq('session_token', playerToken)
    .maybeSingle();

  if (!playerData) {
    sendError(res, 401, 'INVALID_SESSION', 'Player session not found.');
    return;
  }

  const player = playerData as DbPlayerRow;
  if (player.is_kicked) {
    sendError(res, 403, 'PLAYER_KICKED', 'You were removed from this game by the host.');
    return;
  }

  await supabase
    .from('players')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', player.id);

  const scoreboard = computeScoreboard(activePlayers);
  const rank = scoreboard.find((e) => e.playerId === player.id)?.rank ?? scoreboard.length;

  const { data: playerAnswers } = await supabase
    .from('answers')
    .select('slide_id, payload, is_correct, points')
    .eq('game_id', gameId)
    .eq('player_id', player.id);

  const submittedSlideIds = (playerAnswers ?? []).map((a) => (a as { slide_id: string }).slide_id);

  let feedback: PlayerQuestionFeedback | null = null;
  if (
    currentSlide &&
    (game.state === 'question_reveal' ||
      game.state === 'scoreboard' ||
      game.state === 'podium' ||
      game.state === 'ended')
  ) {
    const currentAnswer = (playerAnswers ?? []).find(
      (a) => (a as { slide_id: string }).slide_id === currentSlide.id
    ) as
      | {
          slide_id: string;
          payload: { optionId?: string };
          is_correct: boolean | null;
          points: number;
        }
      | undefined;

    feedback = {
      slideId: currentSlide.id,
      submittedOptionId: currentAnswer?.payload?.optionId ?? null,
      isCorrect: currentAnswer?.is_correct ?? (currentSlide.type === 'poll' ? null : false),
      pointsEarned: currentAnswer?.points ?? 0,
      totalScore: player.total_score,
      streak: player.streak,
      rank,
      totalPlayers: activePlayers.length,
    };
  }

  res.status(200).json({
    role: 'player',
    player: {
      id: player.id,
      nickname: player.nickname,
      totalScore: player.total_score,
      streak: player.streak,
      rank,
      totalPlayers: activePlayers.length,
    },
    submittedSlideIds,
    feedback,
    game: publicGame,
  });
}

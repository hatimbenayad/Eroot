import crypto from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateFriendlyNickname, isNicknameClean } from '../../shared/moderation/nickname';
import { joinGameRequestSchema, type GameOptions } from '../../shared/schemas/game';
import { buildPublicGamePayload, type DbGameRow, type DbPlayerRow } from '../_lib/game-helpers';
import {
  broadcastGameEvent,
  enforceRateLimit,
  getAdminClient,
  getClientIp,
  sendError,
} from '../_lib/supabase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Use POST.');
    return;
  }

  const parsed = joinGameRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'INVALID_REQUEST', parsed.error.issues[0]?.message ?? 'Invalid join payload.');
    return;
  }

  const supabase = getAdminClient();
  const ip = getClientIp(req);
  const allowed = await enforceRateLimit(supabase, `join:${ip}`, 15, 60);
  if (!allowed) {
    sendError(res, 429, 'RATE_LIMITED', 'Too many join attempts. Please wait a minute.');
    return;
  }

  const { pin, nickname: rawNickname, identifier: rawIdentifier } = parsed.data;

  const { data: gameData, error: gameErr } = await supabase
    .from('games')
    .select('*')
    .eq('pin', pin)
    .neq('state', 'ended')
    .maybeSingle();

  if (gameErr || !gameData) {
    sendError(res, 404, 'GAME_NOT_FOUND', 'No active game found for that PIN.');
    return;
  }

  const game = gameData as DbGameRow;
  const settings = (game.settings ?? {}) as GameOptions;

  if (settings.requirePlayerIdentifier && !rawIdentifier?.trim()) {
    sendError(
      res,
      400,
      'IDENTIFIER_REQUIRED',
      `Please enter ${settings.playerIdentifierLabel || 'your identifier'}.`
    );
    return;
  }

  const { data: existingPlayersData, error: playersErr } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', game.id)
    .eq('is_kicked', false);

  if (playersErr) {
    sendError(res, 500, 'PLAYERS_FETCH_FAILED', 'Unable to inspect lobby capacity.');
    return;
  }

  const activePlayers = (existingPlayersData ?? []) as DbPlayerRow[];
  if (activePlayers.length >= game.max_players) {
    sendError(res, 409, 'GAME_FULL', 'This game has reached its player limit.');
    return;
  }

  let finalNickname = '';
  if (settings.friendlyNicknames) {
    const taken = new Set(activePlayers.map((p) => p.nickname.toLowerCase()));
    for (let i = 0; i < 10; i++) {
      const candidate = generateFriendlyNickname();
      if (!taken.has(candidate.toLowerCase())) {
        finalNickname = candidate;
        break;
      }
    }
    if (!finalNickname) {
      finalNickname = generateFriendlyNickname(activePlayers.length + 1);
    }
  } else {
    const cleaned = rawNickname?.trim() ?? '';
    if (!isNicknameClean(cleaned)) {
      sendError(
        res,
        400,
        'INVALID_NICKNAME',
        'Choose a clean nickname between 1 and 24 characters.'
      );
      return;
    }
    finalNickname = cleaned;
  }

  const sessionToken = crypto.randomUUID();
  const { data: insertedPlayer, error: insertErr } = await supabase
    .from('players')
    .insert({
      game_id: game.id,
      nickname: finalNickname,
      identifier: rawIdentifier?.trim() || null,
      session_token: sessionToken,
    })
    .select('*')
    .single();

  if (insertErr || !insertedPlayer) {
    if (insertErr?.code === '23505') {
      sendError(res, 409, 'NICKNAME_TAKEN', 'That nickname is already taken in this game.');
      return;
    }
    sendError(res, 500, 'JOIN_FAILED', 'Unable to join game.');
    return;
  }

  const player = insertedPlayer as DbPlayerRow;
  const updatedRoster = [...activePlayers, player].map((p) => ({
    id: p.id,
    nickname: p.nickname,
  }));

  await broadcastGameEvent(supabase, game.id, 'lobby_roster', { players: updatedRoster });

  res.status(201).json({
    gameId: game.id,
    playerId: player.id,
    sessionToken,
    nickname: player.nickname,
    game: buildPublicGamePayload(game, [...activePlayers, player], 0),
  });
}


import { getSupabaseClient } from '@/lib/supabase';
import type {
  GameOptions,
  LobbyPlayerSummary,
  PlayerQuestionFeedback,
  PublicGameSnapshot,
} from '@shared/schemas/game';
import type { GameAction } from '@shared/state-machine/game-state';

export interface LookupGameResponse {
  gameId: string;
  quizTitle: string;
  themeId: string;
  requirePlayerIdentifier: boolean;
  playerIdentifierLabel: string;
  friendlyNicknames: boolean;
}

export interface JoinGameResponse {
  gameId: string;
  playerId: string;
  sessionToken: string;
  nickname: string;
  game: PublicGameSnapshot;
}

export interface HostSessionResponse {
  role: 'host';
  game: PublicGameSnapshot;
  roster: LobbyPlayerSummary[];
}

export interface PlayerSessionResponse {
  role: 'player';
  player: {
    id: string;
    nickname: string;
    totalScore: number;
    streak: number;
    rank: number;
    totalPlayers: number;
  };
  submittedSlideIds: string[];
  feedback: PlayerQuestionFeedback | null;
  game: PublicGameSnapshot;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
  };
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data.error?.code ?? 'API_ERROR',
      data.error?.message ?? `Request failed (${res.status})`
    );
  }
  return data as T;
}

export async function createLiveGame(
  accessToken: string,
  quizId: string,
  options: GameOptions
): Promise<{ game: PublicGameSnapshot }> {
  const res = await fetch('/api/games/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ quizId, options }),
  });
  return parseJson<{ game: PublicGameSnapshot }>(res);
}

export async function lookupGameByPin(pin: string): Promise<LookupGameResponse> {
  const res = await fetch(`/api/games/lookup?pin=${encodeURIComponent(pin.trim())}`);
  return parseJson<LookupGameResponse>(res);
}

export async function joinGame(payload: {
  pin: string;
  nickname?: string;
  identifier?: string;
}): Promise<JoinGameResponse> {
  const res = await fetch('/api/games/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson<JoinGameResponse>(res);
}

export async function fetchHostGameSession(
  accessToken: string,
  gameId: string
): Promise<HostSessionResponse> {
  const res = await fetch(`/api/games/session?gameId=${encodeURIComponent(gameId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseJson<HostSessionResponse>(res);
}

export async function fetchPlayerGameSession(
  playerToken: string,
  gameId: string
): Promise<PlayerSessionResponse> {
  const res = await fetch(`/api/games/session?gameId=${encodeURIComponent(gameId)}`, {
    headers: { 'x-player-token': playerToken },
  });
  return parseJson<PlayerSessionResponse>(res);
}

export async function advanceGameState(
  accessToken: string,
  gameId: string,
  action: GameAction
): Promise<{ game: PublicGameSnapshot }> {
  const res = await fetch('/api/games/state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ gameId, action }),
  });
  return parseJson<{ game: PublicGameSnapshot }>(res);
}

export async function submitPlayerAnswer(
  playerToken: string,
  payload: {
    gameId: string;
    slideId: string;
    optionId?: string;
    optionIds?: string[];
    text?: string;
    value?: number;
    order?: string[];
  }
): Promise<{ accepted: boolean; slideId: string }> {
  const res = await fetch('/api/games/answer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-player-token': playerToken,
    },
    body: JSON.stringify(payload),
  });
  return parseJson<{ accepted: boolean; slideId: string }>(res);
}

export async function kickGamePlayer(
  accessToken: string,
  gameId: string,
  playerId: string
): Promise<{ ok: boolean; players: LobbyPlayerSummary[] }> {
  const res = await fetch('/api/games/kick', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ gameId, playerId }),
  });
  return parseJson<{ ok: boolean; players: LobbyPlayerSummary[] }>(res);
}

export interface GameRealtimeHandlers {
  onLobbyRoster?: (players: LobbyPlayerSummary[]) => void;
  onGameState?: (game: PublicGameSnapshot) => void;
  onAnswerCount?: (slideId: string, count: number) => void;
  onPlayerKicked?: (playerId: string, players: LobbyPlayerSummary[]) => void;
}

export function subscribeToGameChannel(
  gameId: string,
  handlers: GameRealtimeHandlers
): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return () => {};
  }

  const channel = supabase.channel(`game:${gameId}`);

  channel
    .on('broadcast', { event: 'lobby_roster' }, (msg) => {
      const players = (msg.payload as { players?: LobbyPlayerSummary[] })?.players;
      if (players) handlers.onLobbyRoster?.(players);
    })
    .on('broadcast', { event: 'game_state' }, (msg) => {
      const game = (msg.payload as { game?: PublicGameSnapshot })?.game;
      if (game) handlers.onGameState?.(game);
    })
    .on('broadcast', { event: 'answer_count' }, (msg) => {
      const data = msg.payload as { slideId?: string; count?: number };
      if (data.slideId && typeof data.count === 'number') {
        handlers.onAnswerCount?.(data.slideId, data.count);
      }
    })
    .on('broadcast', { event: 'player_kicked' }, (msg) => {
      const data = msg.payload as { playerId?: string; players?: LobbyPlayerSummary[] };
      if (data.playerId && data.players) {
        handlers.onPlayerKicked?.(data.playerId, data.players);
      }
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}


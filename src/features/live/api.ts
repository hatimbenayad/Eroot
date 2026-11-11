import { getSupabaseClient } from '@/lib/supabase';
import type {
  GameMode,
  GameOptions,
  LobbyPlayerSummary,
  PlayerQuestionFeedback,
  PublicGameSnapshot,
  TeamSummary,
} from '@shared/schemas/game';
import type { PublicSlide } from '@shared/schemas/sanitizer';
import type { GameAction } from '@shared/state-machine/game-state';

export interface LookupGameResponse {
  gameId: string;
  mode?: GameMode;
  quizTitle: string;
  themeId: string;
  requirePlayerIdentifier: boolean;
  playerIdentifierLabel: string;
  friendlyNicknames: boolean;
  teams?: TeamSummary[];
  challengeDeadline?: string | null;
}

export interface JoinGameResponse {
  gameId: string;
  playerId: string;
  sessionToken: string;
  nickname: string;
  teamId?: string | null;
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
  teamId?: string;
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

export interface HostChallengeItem {
  id: string;
  pin: string;
  quiz_title: string;
  state: string;
  challenge_deadline: string | null;
  challenge_timer_enabled: boolean;
  challenge_accuracy_only: boolean;
  max_players: number;
  created_at: string;
  players: {
    id: string;
    nickname: string;
    identifier: string | null;
    total_score: number;
    is_kicked: boolean;
  }[];
}

export interface ChallengePlayState {
  challenge: {
    id: string;
    pin: string;
    quizTitle: string;
    themeId: string;
    slides: PublicSlide[];
    deadline: string | null;
    timerEnabled: boolean;
    accuracyOnly: boolean;
    closed: boolean;
    requirePlayerIdentifier: boolean;
    playerIdentifierLabel: string;
    friendlyNicknames: boolean;
  };
  player: {
    id: string;
    nickname: string;
    totalScore: number;
    streak: number;
  } | null;
  submittedSlideIds: string[];
}

export async function createChallenge(
  accessToken: string,
  payload: {
    quizId: string;
    deadline: string;
    timerEnabled: boolean;
    accuracyOnly: boolean;
    requirePlayerIdentifier: boolean;
    playerIdentifierLabel: string;
    friendlyNicknames: boolean;
    maxPlayers: number;
  }
): Promise<{ gameId: string; pin: string }> {
  const res = await fetch('/api/challenges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  return parseJson<{ gameId: string; pin: string }>(res);
}

export async function fetchHostChallenges(accessToken: string): Promise<HostChallengeItem[]> {
  const res = await fetch('/api/challenges', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await parseJson<{ challenges: HostChallengeItem[] }>(res);
  return data.challenges;
}

export async function manageChallenge(
  accessToken: string,
  payload: {
    gameId: string;
    deadline?: string;
    endEarly?: boolean;
    removePlayerId?: string;
  }
): Promise<void> {
  const res = await fetch('/api/challenges', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  await parseJson<{ ok: boolean }>(res);
}

export async function fetchChallengePlayState(
  pinOrId: { pin?: string; gameId?: string },
  playerToken?: string
): Promise<ChallengePlayState> {
  const param = pinOrId.gameId
    ? `gameId=${encodeURIComponent(pinOrId.gameId)}`
    : `pin=${encodeURIComponent(pinOrId.pin ?? '')}`;
  const res = await fetch(`/api/challenges/play?${param}`, {
    headers: playerToken ? { 'x-player-token': playerToken } : undefined,
  });
  return parseJson<ChallengePlayState>(res);
}

export async function joinChallenge(payload: {
  pin: string;
  nickname?: string;
  identifier?: string;
}): Promise<{ gameId: string; playerId: string; sessionToken: string; nickname: string }> {
  const res = await fetch('/api/challenges/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'join', ...payload }),
  });
  return parseJson(res);
}

export async function submitChallengeAnswer(
  playerToken: string,
  payload: {
    gameId: string;
    slideId: string;
    optionId?: string;
    optionIds?: string[];
    text?: string;
    value?: number;
    order?: string[];
    elapsedMs: number;
  }
): Promise<{
  accepted: boolean;
  isCorrect: boolean | null;
  pointsEarned: number;
  totalScore: number;
}> {
  const res = await fetch('/api/challenges/play', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-player-token': playerToken,
    },
    body: JSON.stringify({ action: 'submit', ...payload }),
  });
  return parseJson(res);
}


export interface StoredPlayerSession {
  gameId: string;
  playerId: string;
  sessionToken: string;
  nickname: string;
}

const KEY_PREFIX = 'eroot_player_session:';
const LAST_GAME_KEY = 'eroot_last_player_game';

export function savePlayerSession(session: StoredPlayerSession): void {
  try {
    localStorage.setItem(`${KEY_PREFIX}${session.gameId}`, JSON.stringify(session));
    localStorage.setItem(LAST_GAME_KEY, session.gameId);
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

export function loadPlayerSession(gameId: string): StoredPlayerSession | null {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${gameId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPlayerSession>;
    if (!parsed.gameId || !parsed.playerId || !parsed.sessionToken || !parsed.nickname) {
      return null;
    }
    return parsed as StoredPlayerSession;
  } catch {
    return null;
  }
}

export function loadLastPlayerGameId(): string | null {
  try {
    return localStorage.getItem(LAST_GAME_KEY);
  } catch {
    return null;
  }
}

export function clearPlayerSession(gameId: string): void {
  try {
    localStorage.removeItem(`${KEY_PREFIX}${gameId}`);
    if (localStorage.getItem(LAST_GAME_KEY) === gameId) {
      localStorage.removeItem(LAST_GAME_KEY);
    }
  } catch {
    // Ignore
  }
}


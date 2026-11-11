import crypto from 'node:crypto';
import type {
  GameMode,
  GameOptions,
  GameState,
  PublicGameSnapshot,
  RevealPayload,
  ScoreboardEntry,
} from '../../shared/schemas/game';
import type { PublicSlide } from '../../shared/schemas/sanitizer';

export function generateGamePin(): string {
  return crypto.randomInt(1_000_000, 10_000_000).toString();
}

export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

export interface DbGameRow {
  id: string;
  pin: string;
  host_id: string;
  quiz_id: string | null;
  mode: GameMode;
  state: GameState;
  current_slide_index: number;
  question_started_at: string | null;
  settings: GameOptions;
  theme_id: string;
  quiz_title: string;
  max_players: number;
  public_slides: PublicSlide[];
  reveal_payload: RevealPayload | null;
}

export interface DbPlayerRow {
  id: string;
  game_id: string;
  nickname: string;
  identifier: string | null;
  session_token: string;
  total_score: number;
  streak: number;
  is_kicked: boolean;
  joined_at: string;
}

export function computeScoreboard(players: readonly DbPlayerRow[]): ScoreboardEntry[] {
  const active = players.filter((p) => !p.is_kicked);
  const sorted = [...active].sort((a, b) => {
    if (b.total_score !== a.total_score) {
      return b.total_score - a.total_score;
    }
    return Date.parse(a.joined_at) - Date.parse(b.joined_at);
  });

  return sorted.map((p, idx) => ({
    playerId: p.id,
    nickname: p.nickname,
    totalScore: p.total_score,
    streak: p.streak,
    rank: idx + 1,
  }));
}

export function buildPublicGamePayload(
  row: DbGameRow,
  players: readonly DbPlayerRow[],
  answerCount = 0
): PublicGameSnapshot {
  const ranked = computeScoreboard(players);
  return {
    id: row.id,
    pin: row.pin,
    mode: row.mode,
    state: row.state,
    currentSlideIndex: row.current_slide_index,
    questionStartedAt: row.question_started_at,
    themeId: row.theme_id,
    quizTitle: row.quiz_title,
    maxPlayers: row.max_players,
    settings: row.settings,
    slides: row.public_slides,
    revealPayload: row.state === 'question_reveal' ? row.reveal_payload : null,
    scoreboard: ranked.slice(0, 5),
    podium: ranked.slice(0, 3),
    answerCount,
  };
}

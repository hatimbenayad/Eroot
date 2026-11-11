import { z } from 'zod';
import type { PublicSlide } from './sanitizer';

export type GameMode = 'classic' | 'team' | 'challenge';

export type GameState =
  | 'lobby'
  | 'question_intro'
  | 'question_active'
  | 'question_reveal'
  | 'scoreboard'
  | 'podium'
  | 'ended';

export const gameOptionsSchema = z.object({
  mode: z.enum(['classic']).default('classic'),
  randomizeQuestions: z.boolean().default(false),
  randomizeAnswers: z.boolean().default(false),
  showQuestionOnDevices: z.boolean().default(false),
  requirePlayerIdentifier: z.boolean().default(false),
  playerIdentifierLabel: z.string().trim().max(60).default('Full name or ID'),
  friendlyNicknames: z.boolean().default(false),
  musicEnabled: z.boolean().default(true),
  musicVolume: z.number().min(0).max(1).default(0.5),
  maxPlayers: z.number().int().min(2).max(500).default(100),
});

export type GameOptions = z.infer<typeof gameOptionsSchema>;

export const createGameRequestSchema = z.object({
  quizId: z.string().uuid(),
  options: gameOptionsSchema.default({}),
});

export const joinGameRequestSchema = z.object({
  pin: z
    .string()
    .trim()
    .regex(/^\d{6,7}$/, 'Enter a valid 6 or 7 digit Game PIN.'),
  nickname: z.string().trim().max(24).optional(),
  identifier: z.string().trim().max(80).optional(),
});

export const submitAnswerRequestSchema = z.object({
  gameId: z.string().uuid(),
  slideId: z.string().min(1),
  optionId: z.string().min(1),
});

export const hostStateActionSchema = z.object({
  gameId: z.string().uuid(),
  action: z.enum(['start', 'begin_question', 'reveal', 'next', 'end']),
});

export const kickPlayerRequestSchema = z.object({
  gameId: z.string().uuid(),
  playerId: z.string().uuid(),
});

export interface ScoreboardEntry {
  playerId: string;
  nickname: string;
  totalScore: number;
  streak: number;
  rank: number;
}

export interface RevealPayload {
  slideId: string;
  correctOptionIds: string[];
  optionCounts: Record<string, number>;
  totalAnswers: number;
}

export interface LobbyPlayerSummary {
  id: string;
  nickname: string;
}

export interface PlayerQuestionFeedback {
  slideId: string;
  submittedOptionId: string | null;
  isCorrect: boolean | null;
  pointsEarned: number;
  totalScore: number;
  streak: number;
  rank: number;
  totalPlayers: number;
}

export interface PublicGameSnapshot {
  id: string;
  pin: string;
  mode: GameMode;
  state: GameState;
  currentSlideIndex: number;
  questionStartedAt: string | null;
  themeId: string;
  quizTitle: string;
  maxPlayers: number;
  settings: GameOptions;
  slides: PublicSlide[];
  revealPayload: RevealPayload | null;
  scoreboard: ScoreboardEntry[];
  podium: ScoreboardEntry[];
  answerCount: number;
}


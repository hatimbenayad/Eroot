import { z } from 'zod';

export const TIME_LIMITS = [5, 10, 20, 30, 60, 90, 120, 240] as const;
export type TimeLimit = (typeof TIME_LIMITS)[number];

export const POINTS_MODES = ['standard', 'double', 'none'] as const;
export type PointsMode = (typeof POINTS_MODES)[number];

export const SELECT_MODES = ['single', 'multi'] as const;
export type SelectMode = (typeof SELECT_MODES)[number];

export const MUSIC_PRESETS = ['chill-pulse', 'arcade-focus', 'bright-synth', 'silent'] as const;
export type MusicPreset = (typeof MUSIC_PRESETS)[number];

export const R1_SLIDE_TYPES = ['quiz', 'true_false', 'poll', 'classic'] as const;
export type SlideType = (typeof R1_SLIDE_TYPES)[number];

export interface SlideOption {
  id: string;
  text: string;
  imageUrl?: string | null;
  isCorrect: boolean;
}

export interface QuizContent {
  options: SlideOption[];
}

export interface PollOption {
  id: string;
  text: string;
  imageUrl?: string | null;
}

export interface PollContent {
  options: PollOption[];
}

export interface ClassicContent {
  body: string;
}

export type SlideContent = QuizContent | PollContent | ClassicContent;

export interface SlideDraft {
  id: string;
  quizId: string;
  position: number;
  type: SlideType;
  title: string;
  mediaUrl: string | null;
  mediaReveal: boolean;
  timeLimit: TimeLimit;
  pointsMode: PointsMode;
  selectMode: SelectMode;
  content: SlideContent;
}

export interface QuizDraft {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  visibility: 'private' | 'link' | 'public';
  themeId: string;
  coverImageUrl: string | null;
  language: string;
  musicPreset: MusicPreset;
  isValid: boolean;
  isPublished: boolean;
}

export const quizSettingsSchema = z.object({
  title: z.string().trim().max(120, 'Title must be 120 characters or fewer.'),
  description: z.string().trim().max(500, 'Description must be 500 characters or fewer.'),
  visibility: z.enum(['private', 'link', 'public']),
  coverImageUrl: z.string().url().nullable().optional(),
  language: z.enum(['en']),
  musicPreset: z.enum(MUSIC_PRESETS),
});

export type QuizSettingsValues = z.infer<typeof quizSettingsSchema>;

export function createSlideId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `s_${Math.random().toString(36).slice(2, 11)}`;
}

export function createDefaultSlide(quizId: string, position: number, type: SlideType = 'quiz'): SlideDraft {
  const base = {
    id: createSlideId(),
    quizId,
    position,
    type,
    title: '',
    mediaUrl: null,
    mediaReveal: false,
    timeLimit: 20 as TimeLimit,
    pointsMode: (type === 'poll' || type === 'classic' ? 'none' : 'standard') as PointsMode,
    selectMode: 'single' as SelectMode,
  };

  if (type === 'true_false') {
    return {
      ...base,
      content: {
        options: [
          { id: createSlideId(), text: 'True', isCorrect: true },
          { id: createSlideId(), text: 'False', isCorrect: false },
        ],
      },
    };
  }

  if (type === 'poll') {
    return {
      ...base,
      content: {
        options: [
          { id: createSlideId(), text: '' },
          { id: createSlideId(), text: '' },
          { id: createSlideId(), text: '' },
          { id: createSlideId(), text: '' },
        ],
      },
    };
  }

  if (type === 'classic') {
    return {
      ...base,
      content: {
        body: '',
      },
    };
  }

  return {
    ...base,
    content: {
      options: [
        { id: createSlideId(), text: '', isCorrect: false },
        { id: createSlideId(), text: '', isCorrect: false },
        { id: createSlideId(), text: '', isCorrect: false },
        { id: createSlideId(), text: '', isCorrect: false },
      ],
    },
  };
}


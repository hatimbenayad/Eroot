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

export const slideOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().max(150),
  imageUrl: z.string().url().nullable().optional(),
  isCorrect: z.boolean(),
});

export const pollOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().max(150),
  imageUrl: z.string().url().nullable().optional(),
});

export const timeLimitSchema = z.union([
  z.literal(5),
  z.literal(10),
  z.literal(20),
  z.literal(30),
  z.literal(60),
  z.literal(90),
  z.literal(120),
  z.literal(240),
]);

const baseSlideFields = {
  id: z.string().min(1),
  quizId: z.string().min(1),
  position: z.number().int().min(0),
  title: z.string().trim().min(1).max(200),
  mediaUrl: z.string().url().nullable(),
  mediaReveal: z.boolean(),
  timeLimit: timeLimitSchema,
  pointsMode: z.enum(POINTS_MODES),
  selectMode: z.enum(SELECT_MODES),
};

export const quizSlideSchema = z
  .object({
    ...baseSlideFields,
    type: z.literal('quiz'),
    content: z.object({
      options: z.array(slideOptionSchema).min(2).max(6),
    }),
  })
  .superRefine((val, ctx) => {
    const filled = val.content.options.filter((o) => o.text.trim().length > 0);
    if (filled.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least 2 filled options required.' });
    }
    if (!filled.some((o) => o.isCorrect)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least 1 filled option must be correct.',
      });
    }
  });

export const trueFalseSlideSchema = z
  .object({
    ...baseSlideFields,
    type: z.literal('true_false'),
    content: z.object({
      options: z.array(slideOptionSchema).length(2),
    }),
  })
  .superRefine((val, ctx) => {
    const correctCount = val.content.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'True or false requires exactly 1 correct answer.',
      });
    }
  });

export const pollSlideSchema = z
  .object({
    ...baseSlideFields,
    type: z.literal('poll'),
    pointsMode: z.literal('none'),
    content: z.object({
      options: z.array(pollOptionSchema).min(2).max(4),
    }),
  })
  .superRefine((val, ctx) => {
    const filled = val.content.options.filter((o) => o.text.trim().length > 0);
    if (filled.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Poll requires at least 2 options.' });
    }
  });

export const classicSlideSchema = z
  .object({
    ...baseSlideFields,
    type: z.literal('classic'),
    pointsMode: z.literal('none'),
    content: z.object({
      body: z.string().max(1500),
    }),
  })
  .superRefine((val, ctx) => {
    if (!val.content.body.trim() && !val.mediaUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Classic slide requires body text or an image.',
      });
    }
  });

export const slideSchema = z.union([
  quizSlideSchema,
  trueFalseSlideSchema,
  pollSlideSchema,
  classicSlideSchema,
]);

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

export function createDefaultSlide(
  quizId: string,
  position: number,
  type: SlideType = 'quiz'
): SlideDraft {
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

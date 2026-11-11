import { z } from 'zod';

export const TIME_LIMITS = [5, 10, 20, 30, 60, 90, 120, 240] as const;
export type TimeLimit = (typeof TIME_LIMITS)[number];

export const POINTS_MODES = ['standard', 'double', 'none'] as const;
export type PointsMode = (typeof POINTS_MODES)[number];

export const SELECT_MODES = ['single', 'multi'] as const;
export type SelectMode = (typeof SELECT_MODES)[number];

export const MUSIC_PRESETS = ['chill-pulse', 'arcade-focus', 'bright-synth', 'silent'] as const;
export type MusicPreset = (typeof MUSIC_PRESETS)[number];

export const MEDIA_SLIDE_TYPES = [
  'classic',
  'big_title',
  'title_text',
  'bullet_points',
  'quote',
  'big_media',
  'video',
] as const;

export const OPINION_SLIDE_TYPES = [
  'poll',
  'scale',
  'nps_scale',
  'word_cloud',
  'open_ended',
] as const;

export const SCORED_SLIDE_TYPES = [
  'quiz',
  'true_false',
  'type_answer',
  'slider',
  'puzzle',
] as const;

export const ALL_SLIDE_TYPES = [
  ...SCORED_SLIDE_TYPES,
  ...OPINION_SLIDE_TYPES,
  ...MEDIA_SLIDE_TYPES,
] as const;

export type SlideType = (typeof ALL_SLIDE_TYPES)[number];

export function isMediaSlideType(type: SlideType): boolean {
  return (MEDIA_SLIDE_TYPES as readonly string[]).includes(type);
}

export function isOpinionSlideType(type: SlideType): boolean {
  return (OPINION_SLIDE_TYPES as readonly string[]).includes(type);
}

export function isScoredSlideType(type: SlideType): boolean {
  return (SCORED_SLIDE_TYPES as readonly string[]).includes(type);
}

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

export interface TypeAnswerContent {
  acceptedAnswers: string[];
}

export interface SliderContent {
  min: number;
  max: number;
  step: number;
  unit: string;
  correctValue: number;
  tolerance: number;
}

export interface PuzzleItem {
  id: string;
  text: string;
}

export interface PuzzleContent {
  items: PuzzleItem[];
}

export interface ScaleContent {
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
}

export interface NpsScaleContent {
  minLabel: string;
  maxLabel: string;
}

export interface WordCloudContent {
  promptHint: string;
}

export interface OpenEndedContent {
  promptHint: string;
  maxLength: number;
}

export interface ClassicContent {
  body: string;
}

export interface BigTitleContent {
  subtitle: string;
}

export interface TitleTextContent {
  body: string;
}

export interface BulletPointsContent {
  bullets: string[];
}

export interface QuoteContent {
  quote: string;
  author: string;
}

export interface BigMediaContent {
  caption: string;
}

export interface VideoContent {
  videoUrl: string;
  caption: string;
}

export type SlideContent =
  | QuizContent
  | PollContent
  | TypeAnswerContent
  | SliderContent
  | PuzzleContent
  | ScaleContent
  | NpsScaleContent
  | WordCloudContent
  | OpenEndedContent
  | ClassicContent
  | BigTitleContent
  | TitleTextContent
  | BulletPointsContent
  | QuoteContent
  | BigMediaContent
  | VideoContent;

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

export function parseSafeVideoEmbed(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:') {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const v = parsed.searchParams.get('v');
    if (v && /^[A-Za-z0-9_-]{6,20}$/.test(v)) {
      return `https://www.youtube-nocookie.com/embed/${v}`;
    }
    const shortsMatch = parsed.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{6,20})/);
    if (shortsMatch?.[1]) {
      return `https://www.youtube-nocookie.com/embed/${shortsMatch[1]}`;
    }
    const embedMatch = parsed.pathname.match(/^\/embed\/([A-Za-z0-9_-]{6,20})/);
    if (embedMatch?.[1]) {
      return `https://www.youtube-nocookie.com/embed/${embedMatch[1]}`;
    }
    return null;
  }

  if (host === 'youtube-nocookie.com') {
    const embedMatch = parsed.pathname.match(/^\/embed\/([A-Za-z0-9_-]{6,20})/);
    return embedMatch?.[1] ? `https://www.youtube-nocookie.com/embed/${embedMatch[1]}` : null;
  }

  if (host === 'youtu.be') {
    const id = parsed.pathname.replace(/^\//, '').split('/')[0];
    if (id && /^[A-Za-z0-9_-]{6,20}$/.test(id)) {
      return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    return null;
  }

  if (host === 'vimeo.com') {
    const id = parsed.pathname.replace(/^\//, '').split('/')[0];
    if (id && /^\d{4,15}$/.test(id)) {
      return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  }

  return null;
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
    const filled = val.content.options.filter(
      (o) => o.text.trim().length > 0 || Boolean(o.imageUrl)
    );
    if (filled.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least 2 options required.' });
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
    const filled = val.content.options.filter(
      (o) => o.text.trim().length > 0 || Boolean(o.imageUrl)
    );
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
  z.object({
    ...baseSlideFields,
    type: z.enum([
      'type_answer',
      'slider',
      'puzzle',
      'scale',
      'nps_scale',
      'word_cloud',
      'open_ended',
      'big_title',
      'title_text',
      'bullet_points',
      'quote',
      'big_media',
      'video',
    ]),
    content: z.record(z.unknown()),
  }),
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
  const nonScored = isOpinionSlideType(type) || isMediaSlideType(type);
  const base = {
    id: createSlideId(),
    quizId,
    position,
    type,
    title: '',
    mediaUrl: null,
    mediaReveal: false,
    timeLimit: 20 as TimeLimit,
    pointsMode: (nonScored ? 'none' : 'standard') as PointsMode,
    selectMode: 'single' as SelectMode,
  };

  switch (type) {
    case 'true_false':
      return {
        ...base,
        content: {
          options: [
            { id: createSlideId(), text: 'True', isCorrect: true },
            { id: createSlideId(), text: 'False', isCorrect: false },
          ],
        },
      };
    case 'poll':
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
    case 'type_answer':
      return {
        ...base,
        content: { acceptedAnswers: ['', ''] } satisfies TypeAnswerContent,
      };
    case 'slider':
      return {
        ...base,
        content: {
          min: 0,
          max: 100,
          step: 1,
          unit: '',
          correctValue: 50,
          tolerance: 5,
        } satisfies SliderContent,
      };
    case 'puzzle':
      return {
        ...base,
        content: {
          items: [
            { id: createSlideId(), text: '' },
            { id: createSlideId(), text: '' },
            { id: createSlideId(), text: '' },
            { id: createSlideId(), text: '' },
          ],
        } satisfies PuzzleContent,
      };
    case 'scale':
      return {
        ...base,
        content: {
          min: 1,
          max: 5,
          minLabel: 'Strongly disagree',
          maxLabel: 'Strongly agree',
        } satisfies ScaleContent,
      };
    case 'nps_scale':
      return {
        ...base,
        content: {
          minLabel: 'Not at all likely',
          maxLabel: 'Extremely likely',
        } satisfies NpsScaleContent,
      };
    case 'word_cloud':
      return {
        ...base,
        content: { promptHint: 'Type up to 30 characters' } satisfies WordCloudContent,
      };
    case 'open_ended':
      return {
        ...base,
        content: { promptHint: 'Share your thoughts...', maxLength: 250 } satisfies OpenEndedContent,
      };
    case 'classic':
    case 'title_text':
      return { ...base, content: { body: '' } satisfies ClassicContent };
    case 'big_title':
      return { ...base, content: { subtitle: '' } satisfies BigTitleContent };
    case 'bullet_points':
      return { ...base, content: { bullets: ['', '', ''] } satisfies BulletPointsContent };
    case 'quote':
      return { ...base, content: { quote: '', author: '' } satisfies QuoteContent };
    case 'big_media':
      return { ...base, content: { caption: '' } satisfies BigMediaContent };
    case 'video':
      return { ...base, content: { videoUrl: '', caption: '' } satisfies VideoContent };
    case 'quiz':
    default:
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
}

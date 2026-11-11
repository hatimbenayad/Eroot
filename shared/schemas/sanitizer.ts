import type {
  ClassicContent,
  PointsMode,
  PollContent,
  QuizContent,
  SelectMode,
  SlideDraft,
  SlideType,
  TimeLimit,
} from './slide';

export interface PublicSlideOption {
  id: string;
  text: string;
  imageUrl?: string | null;
}

export interface PublicSlide {
  id: string;
  position: number;
  type: SlideType;
  title: string;
  mediaUrl: string | null;
  mediaReveal: boolean;
  timeLimit: TimeLimit;
  pointsMode: PointsMode;
  selectMode: SelectMode;
  options: PublicSlideOption[];
  body?: string;
}

/**
 * Strips all authoritative answer keys (`isCorrect`, etc.) and empty trailing options
 * so player devices never receive answer solutions prior to `question_reveal`.
 */
export function sanitizeSlideForPlayer(slide: SlideDraft): PublicSlide {
  const base = {
    id: slide.id,
    position: slide.position,
    type: slide.type,
    title: slide.title,
    mediaUrl: slide.mediaUrl,
    mediaReveal: slide.mediaReveal,
    timeLimit: slide.timeLimit,
    pointsMode: slide.pointsMode,
    selectMode: slide.selectMode,
  };

  if (slide.type === 'classic') {
    const content = slide.content as ClassicContent;
    return {
      ...base,
      options: [],
      body: content.body ?? '',
    };
  }

  if (slide.type === 'poll') {
    const content = slide.content as PollContent;
    return {
      ...base,
      options: (content.options ?? [])
        .filter((o) => o.text.trim().length > 0 || Boolean(o.imageUrl))
        .map((o) => ({
          id: o.id,
          text: o.text,
          imageUrl: o.imageUrl ?? null,
        })),
    };
  }

  const content = slide.content as QuizContent;
  return {
    ...base,
    options: (content.options ?? [])
      .filter((o) => o.text.trim().length > 0 || Boolean(o.imageUrl))
      .map((o) => ({
        id: o.id,
        text: o.text,
        imageUrl: o.imageUrl ?? null,
      })),
  };
}

export function sanitizeSlidesForPlayer(slides: SlideDraft[]): PublicSlide[] {
  return [...slides].sort((a, b) => a.position - b.position).map(sanitizeSlideForPlayer);
}


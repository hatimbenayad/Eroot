import {
  parseSafeVideoEmbed,
  type BigMediaContent,
  type BigTitleContent,
  type BulletPointsContent,
  type ClassicContent,
  type NpsScaleContent,
  type OpenEndedContent,
  type PointsMode,
  type PollContent,
  type PuzzleContent,
  type PuzzleItem,
  type QuizContent,
  type QuoteContent,
  type ScaleContent,
  type SelectMode,
  type SlideDraft,
  type SlideType,
  type SliderContent,
  type TimeLimit,
  type VideoContent,
  type WordCloudContent,
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
  subtitle?: string;
  bullets?: string[];
  quote?: string;
  author?: string;
  caption?: string;
  embedUrl?: string | null;
  sliderConfig?: { min: number; max: number; step: number; unit: string };
  puzzleItems?: PuzzleItem[];
  scaleConfig?: { min: number; max: number; minLabel: string; maxLabel: string };
  promptHint?: string;
  maxLength?: number;
}

function deterministicShufflePuzzle(items: PuzzleItem[]): PuzzleItem[] {
  // Rotate/interleave deterministically if random isn't desired or ensures order != target
  if (items.length < 2) return items;
  return [items[2]!, items[0]!, items[3]!, items[1]!].filter(Boolean);
}

/**
 * Strips all authoritative answer keys (`isCorrect`, `acceptedAnswers`, `correctValue`,
 * `tolerance`, and target `puzzle` sequence) prior to sending slides to players.
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
    options: [] as PublicSlideOption[],
  };

  switch (slide.type) {
    case 'quiz':
    case 'true_false': {
      const content = slide.content as QuizContent;
      return {
        ...base,
        options: (content.options ?? [])
          .filter((o) => o.text.trim().length > 0 || Boolean(o.imageUrl))
          .map((o) => ({ id: o.id, text: o.text, imageUrl: o.imageUrl ?? null })),
      };
    }

    case 'poll': {
      const content = slide.content as PollContent;
      return {
        ...base,
        options: (content.options ?? [])
          .filter((o) => o.text.trim().length > 0 || Boolean(o.imageUrl))
          .map((o) => ({ id: o.id, text: o.text, imageUrl: o.imageUrl ?? null })),
      };
    }

    case 'type_answer':
      return { ...base, maxLength: 20 };

    case 'slider': {
      const content = slide.content as SliderContent;
      return {
        ...base,
        sliderConfig: {
          min: content.min,
          max: content.max,
          step: content.step,
          unit: content.unit ?? '',
        },
      };
    }

    case 'puzzle': {
      const content = slide.content as PuzzleContent;
      return {
        ...base,
        puzzleItems: deterministicShufflePuzzle(content.items ?? []),
      };
    }

    case 'scale': {
      const content = slide.content as ScaleContent;
      return {
        ...base,
        scaleConfig: {
          min: content.min,
          max: content.max,
          minLabel: content.minLabel,
          maxLabel: content.maxLabel,
        },
      };
    }

    case 'nps_scale': {
      const content = slide.content as NpsScaleContent;
      return {
        ...base,
        scaleConfig: {
          min: 0,
          max: 10,
          minLabel: content.minLabel || 'Not at all likely',
          maxLabel: content.maxLabel || 'Extremely likely',
        },
      };
    }

    case 'word_cloud': {
      const content = slide.content as WordCloudContent;
      return {
        ...base,
        promptHint: content.promptHint || 'Enter a short word or phrase',
        maxLength: 30,
      };
    }

    case 'open_ended': {
      const content = slide.content as OpenEndedContent;
      return {
        ...base,
        promptHint: content.promptHint || 'Share your response',
        maxLength: content.maxLength || 250,
      };
    }

    case 'classic':
    case 'title_text': {
      const content = slide.content as ClassicContent;
      return { ...base, body: content.body ?? '' };
    }

    case 'big_title': {
      const content = slide.content as BigTitleContent;
      return { ...base, subtitle: content.subtitle ?? '' };
    }

    case 'bullet_points': {
      const content = slide.content as BulletPointsContent;
      return {
        ...base,
        bullets: (content.bullets ?? []).map((b) => b.trim()).filter(Boolean),
      };
    }

    case 'quote': {
      const content = slide.content as QuoteContent;
      return {
        ...base,
        quote: content.quote ?? '',
        author: content.author ?? '',
      };
    }

    case 'big_media': {
      const content = slide.content as BigMediaContent;
      return { ...base, caption: content.caption ?? '' };
    }

    case 'video': {
      const content = slide.content as VideoContent;
      return {
        ...base,
        caption: content.caption ?? '',
        embedUrl: parseSafeVideoEmbed(content.videoUrl ?? ''),
      };
    }
  }
}

export function sanitizeSlidesForPlayer(slides: SlideDraft[]): PublicSlide[] {
  return [...slides].sort((a, b) => a.position - b.position).map(sanitizeSlideForPlayer);
}

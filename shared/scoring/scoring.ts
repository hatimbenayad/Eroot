import type { AnswerSubmissionPayload } from '../schemas/game';
import {
  isMediaSlideType,
  type PointsMode,
  type PollContent,
  type PuzzleContent,
  type QuizContent,
  type ScaleContent,
  type SlideDraft,
  type SliderContent,
  type TypeAnswerContent,
} from '../schemas/slide';

export function getMaxPoints(mode: PointsMode): number {
  switch (mode) {
    case 'standard':
      return 1000;
    case 'double':
      return 2000;
    case 'none':
      return 0;
  }
}

export function calculateSpeedPoints(params: {
  isCorrect: boolean;
  pointsMode: PointsMode;
  responseMs: number;
  questionMs: number;
  accuracyOnly?: boolean;
}): number {
  const { isCorrect, pointsMode, responseMs, questionMs, accuracyOnly = false } = params;
  if (!isCorrect || pointsMode === 'none') {
    return 0;
  }

  const maxPoints = getMaxPoints(pointsMode);
  if (accuracyOnly) {
    return maxPoints;
  }

  const safeQuestionMs = Math.max(1000, questionMs);
  const clampedResponseMs = Math.min(Math.max(0, responseMs), safeQuestionMs);

  return Math.round((1 - clampedResponseMs / safeQuestionMs / 2) * maxPoints);
}

export interface EvaluatedAnswer {
  validOption: boolean;
  isCorrect: boolean | null;
  points: number;
}

export function calculateNpsScore(scores: readonly number[]): number | null {
  if (scores.length === 0) return null;
  let promoters = 0;
  let detractors = 0;
  for (const s of scores) {
    if (s >= 9) promoters += 1;
    else if (s <= 6) detractors += 1;
  }
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

export function evaluateSlideAnswer(
  slide: SlideDraft,
  submission: AnswerSubmissionPayload,
  responseMs: number,
  options?: { accuracyOnly?: boolean }
): EvaluatedAnswer {
  if (isMediaSlideType(slide.type)) {
    return { validOption: false, isCorrect: null, points: 0 };
  }

  const questionMs = slide.timeLimit * 1000;
  const accuracyOnly = Boolean(options?.accuracyOnly);

  switch (slide.type) {
    case 'quiz': {
      const options = (slide.content as QuizContent).options ?? [];
      if (slide.selectMode === 'multi') {
        const picked = Array.from(new Set(submission.optionIds ?? []));
        if (picked.length === 0) {
          return { validOption: false, isCorrect: null, points: 0 };
        }
        const byId = new Map(options.map((o) => [o.id, o]));
        if (picked.some((id) => !byId.has(id))) {
          return { validOption: false, isCorrect: null, points: 0 };
        }
        const totalCorrect = options.filter((o) => o.isCorrect).length;
        const wrongPicked = picked.filter((id) => !byId.get(id)?.isCorrect).length;
        const correctPicked = picked.filter((id) => byId.get(id)?.isCorrect).length;

        if (wrongPicked > 0 || correctPicked === 0 || totalCorrect === 0) {
          return { validOption: true, isCorrect: false, points: 0 };
        }

        const fullSpeedPoints = calculateSpeedPoints({
          isCorrect: true,
          pointsMode: slide.pointsMode,
          responseMs,
          questionMs,
          accuracyOnly,
        });
        return {
          validOption: true,
          isCorrect: true,
          points: Math.round(fullSpeedPoints * (correctPicked / totalCorrect)),
        };
      }

      const chosen = options.find((o) => o.id === submission.optionId);
      if (!chosen) {
        return { validOption: false, isCorrect: null, points: 0 };
      }
      const isCorrect = Boolean(chosen.isCorrect);
      return {
        validOption: true,
        isCorrect,
        points: calculateSpeedPoints({
          isCorrect,
          pointsMode: slide.pointsMode,
          responseMs,
          questionMs,
          accuracyOnly,
        }),
      };
    }

    case 'true_false': {
      const options = (slide.content as QuizContent).options ?? [];
      const chosen = options.find((o) => o.id === submission.optionId);
      if (!chosen) {
        return { validOption: false, isCorrect: null, points: 0 };
      }
      const isCorrect = Boolean(chosen.isCorrect);
      return {
        validOption: true,
        isCorrect,
        points: calculateSpeedPoints({
          isCorrect,
          pointsMode: slide.pointsMode,
          responseMs,
          questionMs,
          accuracyOnly,
        }),
      };
    }

    case 'type_answer': {
      const text = submission.text?.trim() ?? '';
      if (!text || text.length > 20) {
        return { validOption: false, isCorrect: null, points: 0 };
      }
      const accepted = (slide.content as TypeAnswerContent).acceptedAnswers ?? [];
      const normalized = text.toLowerCase();
      const isCorrect = accepted.some((ans) => ans.trim().toLowerCase() === normalized);
      return {
        validOption: true,
        isCorrect,
        points: calculateSpeedPoints({
          isCorrect,
          pointsMode: slide.pointsMode,
          responseMs,
          questionMs,
          accuracyOnly,
        }),
      };
    }

    case 'slider': {
      if (typeof submission.value !== 'number' || !Number.isFinite(submission.value)) {
        return { validOption: false, isCorrect: null, points: 0 };
      }
      const cfg = slide.content as SliderContent;
      if (submission.value < cfg.min || submission.value > cfg.max) {
        return { validOption: false, isCorrect: null, points: 0 };
      }
      const isCorrect = Math.abs(submission.value - cfg.correctValue) <= cfg.tolerance;
      return {
        validOption: true,
        isCorrect,
        points: calculateSpeedPoints({
          isCorrect,
          pointsMode: slide.pointsMode,
          responseMs,
          questionMs,
          accuracyOnly,
        }),
      };
    }

    case 'puzzle': {
      const items = (slide.content as PuzzleContent).items ?? [];
      const order = submission.order ?? [];
      if (order.length !== 4 || items.length !== 4) {
        return { validOption: false, isCorrect: null, points: 0 };
      }
      const itemSet = new Set(items.map((i) => i.id));
      const orderSet = new Set(order);
      if (orderSet.size !== 4 || order.some((id) => !itemSet.has(id))) {
        return { validOption: false, isCorrect: null, points: 0 };
      }
      const isCorrect = items.every((item, idx) => item.id === order[idx]);
      return {
        validOption: true,
        isCorrect,
        points: calculateSpeedPoints({
          isCorrect,
          pointsMode: slide.pointsMode,
          responseMs,
          questionMs,
          accuracyOnly,
        }),
      };
    }

    case 'poll': {
      const options = (slide.content as PollContent).options ?? [];
      if (!options.some((o) => o.id === submission.optionId)) {
        return { validOption: false, isCorrect: null, points: 0 };
      }
      return { validOption: true, isCorrect: null, points: 0 };
    }

    case 'scale': {
      const cfg = slide.content as ScaleContent;
      if (
        typeof submission.value !== 'number' ||
        submission.value < cfg.min ||
        submission.value > cfg.max
      ) {
        return { validOption: false, isCorrect: null, points: 0 };
      }
      return { validOption: true, isCorrect: null, points: 0 };
    }

    case 'nps_scale': {
      if (
        typeof submission.value !== 'number' ||
        submission.value < 0 ||
        submission.value > 10
      ) {
        return { validOption: false, isCorrect: null, points: 0 };
      }
      return { validOption: true, isCorrect: null, points: 0 };
    }

    case 'word_cloud': {
      const text = submission.text?.trim() ?? '';
      if (!text || text.length > 30) {
        return { validOption: false, isCorrect: null, points: 0 };
      }
      return { validOption: true, isCorrect: null, points: 0 };
    }

    case 'open_ended': {
      const text = submission.text?.trim() ?? '';
      if (!text || text.length > 250) {
        return { validOption: false, isCorrect: null, points: 0 };
      }
      return { validOption: true, isCorrect: null, points: 0 };
    }

    default:
      return { validOption: false, isCorrect: null, points: 0 };
  }
}

export function evaluateR1SlideAnswer(
  slide: SlideDraft,
  optionId: string,
  responseMs: number
): EvaluatedAnswer {
  return evaluateSlideAnswer(slide, { optionId }, responseMs);
}

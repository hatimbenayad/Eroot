import type { PointsMode, QuizContent, SlideDraft } from '../schemas/slide';

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
}): number {
  const { isCorrect, pointsMode, responseMs, questionMs } = params;
  if (!isCorrect || pointsMode === 'none') {
    return 0;
  }

  const maxPoints = getMaxPoints(pointsMode);
  const safeQuestionMs = Math.max(1000, questionMs);
  const clampedResponseMs = Math.min(Math.max(0, responseMs), safeQuestionMs);

  return Math.round((1 - clampedResponseMs / safeQuestionMs / 2) * maxPoints);
}

export interface EvaluatedAnswer {
  validOption: boolean;
  isCorrect: boolean | null;
  points: number;
}

export function evaluateR1SlideAnswer(
  slide: SlideDraft,
  optionId: string,
  responseMs: number
): EvaluatedAnswer {
  if (slide.type === 'classic') {
    return { validOption: false, isCorrect: null, points: 0 };
  }

  const options = (slide.content as QuizContent).options ?? [];
  const chosen = options.find((o) => o.id === optionId);
  if (!chosen) {
    return { validOption: false, isCorrect: null, points: 0 };
  }

  if (slide.type === 'poll') {
    return { validOption: true, isCorrect: null, points: 0 };
  }

  const isCorrect = Boolean((chosen as { isCorrect?: boolean }).isCorrect);
  const points = calculateSpeedPoints({
    isCorrect,
    pointsMode: slide.pointsMode,
    responseMs,
    questionMs: slide.timeLimit * 1000,
  });

  return {
    validOption: true,
    isCorrect,
    points,
  };
}


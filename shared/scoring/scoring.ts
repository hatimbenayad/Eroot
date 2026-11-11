import type { AnswerSubmissionPayload } from '../schemas/game';
import {
  isMediaSlideType,
  type PinAnswerContent,
  type PinTarget,
  type PointsMode,
  type PollContent,
  type PuzzleContent,
  type QuizContent,
  type ScaleContent,
  type SlideDraft,
  type SliderContent,
  type TypeAnswerContent,
} from '../schemas/slide';

export function isPointInPinTarget(
  point: { x: number; y: number },
  target: PinTarget
): boolean {
  if (
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    point.x < 0 ||
    point.x > 1 ||
    point.y < 0 ||
    point.y > 1
  ) {
    return false;
  }

  if (target.shape === 'circle') {
    return Math.hypot(point.x - target.cx, point.y - target.cy) <= target.radius;
  }

  const pts = target.points ?? [];
  if (pts.length < 3) return false;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i]!.x;
    const yi = pts[i]!.y;
    const xj = pts[j]!.x;
    const yj = pts[j]!.y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export interface BrainstormIdeaSummary {
  id: string;
  text: string;
  authorNickname?: string;
  votes: number;
}

export function aggregateBrainstormIdeas(
  rows: ReadonlyArray<{
    playerId: string;
    nickname?: string;
    payload: AnswerSubmissionPayload;
  }>
): BrainstormIdeaSummary[] {
  const ideaMap = new Map<string, BrainstormIdeaSummary>();

  for (const row of rows) {
    const rawIdeas =
      Array.isArray(row.payload.ideas) && row.payload.ideas.length > 0
        ? row.payload.ideas
        : row.payload.text?.trim()
          ? [row.payload.text.trim()]
          : [];

    const seenForPlayer = new Set<string>();
    let idx = 0;
    for (const raw of rawIdeas) {
      const cleaned = raw.trim().slice(0, 80);
      if (!cleaned) continue;
      const lower = cleaned.toLowerCase();
      if (seenForPlayer.has(lower)) continue;
      seenForPlayer.add(lower);
      if (idx >= 3) break;
      const id = `${row.playerId}:${idx}`;
      ideaMap.set(id, {
        id,
        text: cleaned,
        authorNickname: row.nickname,
        votes: 0,
      });
      idx += 1;
    }
  }

  for (const row of rows) {
    const voted = Array.from(new Set(row.payload.votedIdeaIds ?? [])).slice(0, 3);
    for (const ideaId of voted) {
      const entry = ideaMap.get(ideaId);
      if (entry) {
        entry.votes += 1;
      }
    }
  }

  return Array.from(ideaMap.values()).sort(
    (a, b) => b.votes - a.votes || a.text.localeCompare(b.text)
  );
}

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

    case 'pin_answer': {
      if (
        !submission.pin ||
        !Number.isFinite(submission.pin.x) ||
        !Number.isFinite(submission.pin.y) ||
        submission.pin.x < 0 ||
        submission.pin.x > 1 ||
        submission.pin.y < 0 ||
        submission.pin.y > 1
      ) {
        return { validOption: false, isCorrect: null, points: 0 };
      }
      const target = (slide.content as PinAnswerContent).target;
      const isCorrect = isPointInPinTarget(submission.pin, target);
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

    case 'drop_pin': {
      if (
        !submission.pin ||
        !Number.isFinite(submission.pin.x) ||
        !Number.isFinite(submission.pin.y) ||
        submission.pin.x < 0 ||
        submission.pin.x > 1 ||
        submission.pin.y < 0 ||
        submission.pin.y > 1
      ) {
        return { validOption: false, isCorrect: null, points: 0 };
      }
      return { validOption: true, isCorrect: null, points: 0 };
    }

    case 'brainstorm': {
      const text = submission.text?.trim() ?? '';
      if (!text || text.length > 80) {
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

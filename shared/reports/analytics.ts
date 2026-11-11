import type { AnswerSubmissionPayload } from '../schemas/game';
import {
  isMediaSlideType,
  isScoredSlideType,
  type QuizContent,
  type SlideDraft,
} from '../schemas/slide';

export interface ReportPlayerRow {
  id: string;
  nickname: string;
  identifier: string | null;
  total_score: number;
  streak: number;
  is_kicked: boolean;
  joined_at: string;
}

export interface ReportAnswerRow {
  id: string;
  player_id: string;
  slide_id: string;
  payload: AnswerSubmissionPayload;
  response_ms: number;
  points: number;
  is_correct: boolean | null;
}

export interface QuestionAnalytics {
  slideId: string;
  index: number;
  title: string;
  type: SlideDraft['type'];
  isScored: boolean;
  answeredCount: number;
  correctCount: number;
  correctPercent: number;
  avgResponseSec: number;
  isDifficult: boolean;
  optionCounts: Record<string, number>;
  textResponses: string[];
  slide: SlideDraft;
}

export interface PlayerAnalytics {
  playerId: string;
  rank: number;
  nickname: string;
  identifier: string | null;
  totalScore: number;
  answeredCount: number;
  correctCount: number;
  accuracyPercent: number;
  needsHelp: boolean;
  didNotFinish: boolean;
  answersBySlideId: Record<
    string,
    { isCorrect: boolean | null; points: number; responseMs: number }
  >;
}

export interface ReportAnalytics {
  playerCount: number;
  questionCount: number;
  scoredQuestionCount: number;
  avgAccuracyPercent: number;
  avgResponseSec: number;
  difficultQuestions: QuestionAnalytics[];
  playersNeedingHelp: PlayerAnalytics[];
  unfinishedPlayers: PlayerAnalytics[];
  players: PlayerAnalytics[];
  questions: QuestionAnalytics[];
  podium: PlayerAnalytics[];
}

export function computeReportAnalytics(
  slides: SlideDraft[],
  rawPlayers: ReportPlayerRow[],
  rawAnswers: ReportAnswerRow[]
): ReportAnalytics {
  const activePlayers = rawPlayers.filter((p) => !p.is_kicked);
  const interactiveSlides = slides.filter((s) => !isMediaSlideType(s.type));
  const scoredSlides = slides.filter((s) => isScoredSlideType(s.type));

  const answersBySlide = new Map<string, ReportAnswerRow[]>();
  const answersByPlayer = new Map<string, ReportAnswerRow[]>();

  for (const ans of rawAnswers) {
    const sList = answersBySlide.get(ans.slide_id) ?? [];
    sList.push(ans);
    answersBySlide.set(ans.slide_id, sList);

    const pList = answersByPlayer.get(ans.player_id) ?? [];
    pList.push(ans);
    answersByPlayer.set(ans.player_id, pList);
  }

  const questions: QuestionAnalytics[] = interactiveSlides.map((slide, idx) => {
    const sAnswers = answersBySlide.get(slide.id) ?? [];
    const isScored = isScoredSlideType(slide.type);
    const correctCount = isScored ? sAnswers.filter((a) => a.is_correct === true).length : 0;
    const denominator = Math.max(activePlayers.length, sAnswers.length);
    const correctPercent =
      isScored && denominator > 0 ? Math.round((correctCount / denominator) * 100) : 0;

    const avgMs =
      sAnswers.length > 0
        ? sAnswers.reduce((acc, a) => acc + a.response_ms, 0) / sAnswers.length
        : 0;

    const optionCounts: Record<string, number> = {};
    const textResponses: string[] = [];

    for (const ans of sAnswers) {
      if (ans.payload?.optionId) {
        optionCounts[ans.payload.optionId] = (optionCounts[ans.payload.optionId] ?? 0) + 1;
      }
      if (Array.isArray(ans.payload?.optionIds)) {
        for (const oid of ans.payload.optionIds) {
          optionCounts[oid] = (optionCounts[oid] ?? 0) + 1;
        }
      }
      if (typeof ans.payload?.text === 'string' && ans.payload.text.trim()) {
        textResponses.push(ans.payload.text.trim());
      }
    }

    // Ensure quiz options exist in map even with 0 picks
    if (slide.type === 'quiz' || slide.type === 'true_false' || slide.type === 'poll') {
      for (const opt of (slide.content as QuizContent).options ?? []) {
        if (optionCounts[opt.id] === undefined) {
          optionCounts[opt.id] = 0;
        }
      }
    }

    return {
      slideId: slide.id,
      index: idx + 1,
      title: slide.title,
      type: slide.type,
      isScored,
      answeredCount: sAnswers.length,
      correctCount,
      correctPercent,
      avgResponseSec: Number((avgMs / 1000).toFixed(2)),
      isDifficult: isScored && denominator > 0 && correctPercent < 35,
      optionCounts,
      textResponses,
      slide,
    };
  });

  const sortedPlayers = [...activePlayers].sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score;
    return Date.parse(a.joined_at) - Date.parse(b.joined_at);
  });

  const players: PlayerAnalytics[] = sortedPlayers.map((player, idx) => {
    const pAnswers = answersByPlayer.get(player.id) ?? [];
    const answersBySlideId: PlayerAnalytics['answersBySlideId'] = {};
    let correctCount = 0;
    for (const ans of pAnswers) {
      answersBySlideId[ans.slide_id] = {
        isCorrect: ans.is_correct,
        points: ans.points,
        responseMs: ans.response_ms,
      };
      if (ans.is_correct === true) {
        correctCount += 1;
      }
    }

    const accuracyPercent =
      scoredSlides.length > 0 ? Math.round((correctCount / scoredSlides.length) * 100) : 0;

    return {
      playerId: player.id,
      rank: idx + 1,
      nickname: player.nickname,
      identifier: player.identifier,
      totalScore: player.total_score,
      answeredCount: pAnswers.length,
      correctCount,
      accuracyPercent,
      needsHelp: scoredSlides.length > 0 && accuracyPercent < 50,
      didNotFinish: interactiveSlides.length > 0 && pAnswers.length < interactiveSlides.length,
      answersBySlideId,
    };
  });

  const avgAccuracyPercent =
    players.length > 0 && scoredSlides.length > 0
      ? Math.round(players.reduce((s, p) => s + p.accuracyPercent, 0) / players.length)
      : 0;

  const avgResponseSec =
    rawAnswers.length > 0
      ? Number(
          (
            rawAnswers.reduce((s, a) => s + a.response_ms, 0) /
            rawAnswers.length /
            1000
          ).toFixed(2)
        )
      : 0;

  return {
    playerCount: activePlayers.length,
    questionCount: interactiveSlides.length,
    scoredQuestionCount: scoredSlides.length,
    avgAccuracyPercent,
    avgResponseSec,
    difficultQuestions: questions.filter((q) => q.isDifficult),
    playersNeedingHelp: players.filter((p) => p.needsHelp),
    unfinishedPlayers: players.filter((p) => p.didNotFinish),
    players,
    questions,
    podium: players.slice(0, 3),
  };
}

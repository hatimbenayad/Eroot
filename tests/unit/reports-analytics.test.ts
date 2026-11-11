import { describe, expect, it } from 'vitest';
import { computeReportAnalytics } from '@shared/reports/analytics';
import { createDefaultSlide, type QuizContent } from '@shared/schemas/slide';

describe('Report Analytics (U6)', () => {
  it('identifies difficult questions (<35%), struggling players (<50%), and unfinished players', () => {
    const slides = [0, 1, 2, 3].map((i) => {
      const s = createDefaultSlide('quiz-1', i, 'quiz');
      s.id = `s${i}`;
      s.title = `Question ${i + 1}`;
      (s.content as QuizContent).options[0]!.text = 'Yes';
      (s.content as QuizContent).options[0]!.isCorrect = true;
      (s.content as QuizContent).options[1]!.text = 'No';
      return s;
    });

    const players = [
      {
        id: 'p1',
        nickname: 'Alice',
        identifier: 'alice@school.edu',
        total_score: 3000,
        streak: 1,
        is_kicked: false,
        joined_at: '2026-11-11T10:00:00Z',
      },
      {
        id: 'p2',
        nickname: 'Bob',
        identifier: 'bob@school.edu',
        total_score: 1000,
        streak: 0,
        is_kicked: false,
        joined_at: '2026-11-11T10:01:00Z',
      },
      {
        id: 'p3',
        nickname: 'Cara',
        identifier: null,
        total_score: 0,
        streak: 0,
        is_kicked: false,
        joined_at: '2026-11-11T10:02:00Z',
      },
    ];

    // Q1 (s0): 0/3 = 0% (difficult)
    // Q2 (s1): 1/3 = 33% (difficult)
    // Q3 (s2): 1/3 = 33% (difficult)
    // Q4 (s3): 2/3 = 67% (ok)
    const answers = [
      { id: 'a1', player_id: 'p1', slide_id: 's0', payload: { optionId: 'o2' }, response_ms: 2000, points: 0, is_correct: false },
      { id: 'a2', player_id: 'p1', slide_id: 's1', payload: { optionId: 'o1' }, response_ms: 1500, points: 900, is_correct: true },
      { id: 'a3', player_id: 'p1', slide_id: 's2', payload: { optionId: 'o1' }, response_ms: 1500, points: 900, is_correct: true },
      { id: 'a4', player_id: 'p1', slide_id: 's3', payload: { optionId: 'o1' }, response_ms: 1000, points: 950, is_correct: true },

      { id: 'a5', player_id: 'p2', slide_id: 's0', payload: { optionId: 'o2' }, response_ms: 3000, points: 0, is_correct: false },
      { id: 'a6', player_id: 'p2', slide_id: 's1', payload: { optionId: 'o2' }, response_ms: 3000, points: 0, is_correct: false },
      { id: 'a7', player_id: 'p2', slide_id: 's2', payload: { optionId: 'o2' }, response_ms: 3000, points: 0, is_correct: false },
      { id: 'a8', player_id: 'p2', slide_id: 's3', payload: { optionId: 'o1' }, response_ms: 2500, points: 850, is_correct: true },

      // Cara only answered s0 (unfinished)
      { id: 'a9', player_id: 'p3', slide_id: 's0', payload: { optionId: 'o2' }, response_ms: 5000, points: 0, is_correct: false },
    ];

    const report = computeReportAnalytics(slides, players, answers);

    expect(report.playerCount).toBe(3);
    expect(report.difficultQuestions.map((q) => q.slideId)).toEqual(['s0', 's1', 's2']);
    expect(report.playersNeedingHelp.map((p) => p.nickname)).toEqual(['Bob', 'Cara']);
    expect(report.unfinishedPlayers.map((p) => p.nickname)).toEqual(['Cara']);
    expect(report.players[0]?.identifier).toBe('alice@school.edu');
  });

  it('handles zero players or poll-only quizzes without NaN', () => {
    const poll = createDefaultSlide('quiz-1', 0, 'poll');
    const report = computeReportAnalytics([poll], [], []);
    expect(report.avgAccuracyPercent).toBe(0);
    expect(report.avgResponseSec).toBe(0);
    expect(report.difficultQuestions).toEqual([]);
  });
});

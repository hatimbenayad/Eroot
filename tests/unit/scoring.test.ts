import { describe, expect, it } from 'vitest';
import { calculateSpeedPoints, evaluateR1SlideAnswer, getMaxPoints } from '@shared/scoring/scoring';
import { createDefaultSlide, type PollContent, type QuizContent } from '@shared/schemas/slide';

describe('Scoring Engine (U4)', () => {
  it('maps points modes accurately', () => {
    expect(getMaxPoints('standard')).toBe(1000);
    expect(getMaxPoints('double')).toBe(2000);
    expect(getMaxPoints('none')).toBe(0);
  });

  it('computes speed-based points with exact formula and zero negative scores', () => {
    expect(
      calculateSpeedPoints({
        isCorrect: true,
        pointsMode: 'standard',
        responseMs: 0,
        questionMs: 20_000,
      })
    ).toBe(1000);

    expect(
      calculateSpeedPoints({
        isCorrect: true,
        pointsMode: 'standard',
        responseMs: 10_000,
        questionMs: 20_000,
      })
    ).toBe(750);

    expect(
      calculateSpeedPoints({
        isCorrect: true,
        pointsMode: 'standard',
        responseMs: 20_000,
        questionMs: 20_000,
      })
    ).toBe(500);

    expect(
      calculateSpeedPoints({
        isCorrect: true,
        pointsMode: 'double',
        responseMs: 10_000,
        questionMs: 20_000,
      })
    ).toBe(1500);

    expect(
      calculateSpeedPoints({
        isCorrect: false,
        pointsMode: 'standard',
        responseMs: 500,
        questionMs: 20_000,
      })
    ).toBe(0);

    // Clamps out-of-range timings safely
    expect(
      calculateSpeedPoints({
        isCorrect: true,
        pointsMode: 'standard',
        responseMs: 50_000,
        questionMs: 20_000,
      })
    ).toBe(500);
  });

  it('evaluates quiz, poll, and classic slides accurately', () => {
    const quiz = createDefaultSlide('q1', 0, 'quiz');
    const opts = (quiz.content as QuizContent).options;
    opts[0]!.text = 'Correct';
    opts[0]!.isCorrect = true;
    opts[1]!.text = 'Wrong';

    const ok = evaluateR1SlideAnswer(quiz, opts[0]!.id, 0);
    expect(ok).toEqual({ validOption: true, isCorrect: true, points: 1000 });

    const wrong = evaluateR1SlideAnswer(quiz, opts[1]!.id, 1000);
    expect(wrong).toEqual({ validOption: true, isCorrect: false, points: 0 });

    const poll = createDefaultSlide('q1', 1, 'poll');
    const pollOpt = (poll.content as PollContent).options[0]!;
    pollOpt.text = 'Option 1';
    expect(evaluateR1SlideAnswer(poll, pollOpt.id, 1000)).toEqual({
      validOption: true,
      isCorrect: null,
      points: 0,
    });
  });
});


import { describe, expect, it } from 'vitest';
import { sanitizeSlideForPlayer } from '@shared/schemas/sanitizer';
import {
  createDefaultSlide,
  parseSafeVideoEmbed,
  type PuzzleContent,
  type QuizContent,
  type SliderContent,
  type TypeAnswerContent,
  type VideoContent,
} from '@shared/schemas/slide';
import { calculateNpsScore, evaluateSlideAnswer } from '@shared/scoring/scoring';
import { validateSlide } from '@shared/validation/quiz-validation';

describe('U5 R2 Question, Opinion & Media Types', () => {
  it('scores Multi-select proportionally and awards 0 on any wrong option', () => {
    const slide = createDefaultSlide('q1', 0, 'quiz');
    slide.selectMode = 'multi';
    const opts = (slide.content as QuizContent).options;
    opts[0]!.text = 'Python';
    opts[0]!.isCorrect = true;
    opts[1]!.text = 'HTML';
    opts[1]!.isCorrect = false;
    opts[2]!.text = 'TypeScript';
    opts[2]!.isCorrect = true;

    // 1 of 2 correct picked at 0ms -> 500
    expect(evaluateSlideAnswer(slide, { optionIds: [opts[0]!.id] }, 0)).toEqual({
      validOption: true,
      isCorrect: true,
      points: 500,
    });

    // All 2 correct picked at 0ms -> 1000
    expect(evaluateSlideAnswer(slide, { optionIds: [opts[0]!.id, opts[2]!.id] }, 0)).toEqual({
      validOption: true,
      isCorrect: true,
      points: 1000,
    });

    // 1 correct + 1 wrong -> 0
    expect(evaluateSlideAnswer(slide, { optionIds: [opts[0]!.id, opts[1]!.id] }, 0)).toEqual({
      validOption: true,
      isCorrect: false,
      points: 0,
    });
  });

  it('evaluates and sanitizes Type answer, Slider, and Puzzle', () => {
    // Type answer
    const typeSlide = createDefaultSlide('q1', 0, 'type_answer');
    typeSlide.title = 'Capital of Morocco?';
    (typeSlide.content as TypeAnswerContent).acceptedAnswers = ['Rabat'];
    expect(validateSlide(typeSlide).valid).toBe(true);
    expect('acceptedAnswers' in sanitizeSlideForPlayer(typeSlide)).toBe(false);
    expect(evaluateSlideAnswer(typeSlide, { text: '  rabat ' }, 0).points).toBe(1000);
    expect(evaluateSlideAnswer(typeSlide, { text: 'Fes' }, 0).points).toBe(0);

    // Slider
    const sliderSlide = createDefaultSlide('q1', 1, 'slider');
    sliderSlide.title = 'Year of Moon landing?';
    (sliderSlide.content as SliderContent) = {
      min: 1950,
      max: 2000,
      step: 1,
      unit: '',
      correctValue: 1969,
      tolerance: 2,
    };
    const sanitizedSlider = sanitizeSlideForPlayer(sliderSlide);
    expect(sanitizedSlider.sliderConfig).toEqual({ min: 1950, max: 2000, step: 1, unit: '' });
    expect('correctValue' in (sanitizedSlider as unknown as Record<string, unknown>)).toBe(false);
    expect(evaluateSlideAnswer(sliderSlide, { value: 1971 }, 0).isCorrect).toBe(true);
    expect(evaluateSlideAnswer(sliderSlide, { value: 1972 }, 0).isCorrect).toBe(false);

    // Puzzle
    const puzzleSlide = createDefaultSlide('q1', 2, 'puzzle');
    puzzleSlide.title = 'Order 1 to 4';
    const items = (puzzleSlide.content as PuzzleContent).items;
    items.forEach((it, idx) => {
      it.text = `Step ${idx + 1}`;
    });
    const sanitizedPuzzle = sanitizeSlideForPlayer(puzzleSlide);
    expect(sanitizedPuzzle.puzzleItems?.map((i) => i.id)).not.toEqual(items.map((i) => i.id));
    expect(evaluateSlideAnswer(puzzleSlide, { order: items.map((i) => i.id) }, 0).points).toBe(1000);
    expect(
      evaluateSlideAnswer(puzzleSlide, { order: [...items].reverse().map((i) => i.id) }, 0).points
    ).toBe(0);
  });

  it('computes NPS score and validates safe YouTube/Vimeo embed URLs', () => {
    expect(calculateNpsScore([10, 9, 5, 8])).toBe(25);
    expect(calculateNpsScore([])).toBeNull();

    expect(parseSafeVideoEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
    );
    expect(parseSafeVideoEmbed('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
    );
    expect(parseSafeVideoEmbed('javascript:alert(1)')).toBeNull();

    const vidSlide = createDefaultSlide('q1', 0, 'video');
    vidSlide.title = 'Intro video';
    (vidSlide.content as VideoContent).videoUrl = 'javascript:alert(1)';
    expect(validateSlide(vidSlide).valid).toBe(false);
  });
});


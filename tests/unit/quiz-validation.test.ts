import { describe, expect, it } from 'vitest';
import { createDefaultSlide, type QuizContent } from '@shared/schemas/slide';
import { validateQuiz, validateSlide } from '@shared/validation/quiz-validation';

describe('quiz-validation', () => {
  it('flags missing question, missing answers 1-2, and missing correct answer on Quiz slide', () => {
    const slide = createDefaultSlide('quiz-1', 0, 'quiz');
    const result = validateSlide(slide);

    expect(result.valid).toBe(false);
    expect(result.questionError).toBe("You haven't added a question.");
    expect(result.optionErrors[0]).toBe("You haven't added Answer 1.");
    expect(result.optionErrors[1]).toBe("You haven't added Answer 2.");
    expect(result.correctError).toBe('Select at least one correct answer.');
  });

  it('passes when question, >= 2 answers, and >= 1 filled correct answer are provided', () => {
    const slide = createDefaultSlide('quiz-1', 0, 'quiz');
    slide.title = 'What is the capital of Morocco?';
    const opts = (slide.content as QuizContent).options;
    opts[0]!.text = 'Rabat';
    opts[0]!.isCorrect = true;
    opts[1]!.text = 'Casablanca';

    const result = validateSlide(slide);
    expect(result.valid).toBe(true);
    expect(validateQuiz([slide]).valid).toBe(true);
  });

  it('requires added optional answers 5 or 6 to be non-empty', () => {
    const slide = createDefaultSlide('quiz-1', 0, 'quiz');
    slide.title = 'Pick a prime';
    const opts = (slide.content as QuizContent).options;
    opts[0]!.text = '2';
    opts[0]!.isCorrect = true;
    opts[1]!.text = '4';
    opts.push({ id: 'extra-5', text: '', isCorrect: false });

    const result = validateSlide(slide);
    expect(result.valid).toBe(false);
    expect(result.optionErrors[4]).toBe('Fill Answer 5 or remove it.');
  });
});


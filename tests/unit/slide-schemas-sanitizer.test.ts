import { describe, expect, it } from 'vitest';
import { convertSlideType } from '@/features/creator/store';
import { sanitizeSlideForPlayer } from '@shared/schemas/sanitizer';
import {
  createDefaultSlide,
  slideSchema,
  type ClassicContent,
  type PollContent,
  type QuizContent,
} from '@shared/schemas/slide';

describe('U3 slide Zod schemas, type switching & sanitizer', () => {
  it('validates all 4 R1 slide types with strict Zod schemas', () => {
    const quiz = createDefaultSlide('q1', 0, 'quiz');
    quiz.title = 'Q1?';
    (quiz.content as QuizContent).options[0]!.text = 'A';
    (quiz.content as QuizContent).options[0]!.isCorrect = true;
    (quiz.content as QuizContent).options[1]!.text = 'B';
    expect(slideSchema.safeParse(quiz).success).toBe(true);

    const tf = createDefaultSlide('q1', 1, 'true_false');
    tf.title = 'Sun rises in the east?';
    expect(slideSchema.safeParse(tf).success).toBe(true);

    const poll = createDefaultSlide('q1', 2, 'poll');
    poll.title = 'Best language?';
    (poll.content as PollContent).options[0]!.text = 'TypeScript';
    (poll.content as PollContent).options[1]!.text = 'Rust';
    expect(slideSchema.safeParse(poll).success).toBe(true);

    const classic = createDefaultSlide('q1', 3, 'classic');
    classic.title = 'Welcome!';
    (classic.content as ClassicContent).body = 'Let us start.';
    expect(slideSchema.safeParse(classic).success).toBe(true);
  });

  it('strips isCorrect and empty optional slots when sanitizing for players', () => {
    const quiz = createDefaultSlide('q1', 0, 'quiz');
    quiz.title = 'Capital of France?';
    const opts = (quiz.content as QuizContent).options;
    opts[0]!.text = 'Paris';
    opts[0]!.isCorrect = true;
    opts[1]!.text = 'Lyon';
    // Leave options 2 and 3 empty

    const sanitized = sanitizeSlideForPlayer(quiz);
    expect(sanitized.options).toHaveLength(2);
    expect(sanitized.options[0]).toEqual({ id: opts[0]!.id, text: 'Paris', imageUrl: null });
    expect('isCorrect' in (sanitized.options[0] as object)).toBe(false);
  });

  it('preserves compatible title and option texts when converting Quiz -> Poll -> Classic', () => {
    const quiz = createDefaultSlide('q1', 0, 'quiz');
    quiz.title = 'Pick one';
    (quiz.content as QuizContent).options[0]!.text = 'Red';
    (quiz.content as QuizContent).options[1]!.text = 'Blue';

    const poll = convertSlideType(quiz, 'poll');
    expect(poll.type).toBe('poll');
    expect(poll.pointsMode).toBe('none');
    expect(poll.title).toBe('Pick one');
    expect((poll.content as PollContent).options[0]?.text).toBe('Red');
    expect('isCorrect' in (poll.content as PollContent).options[0]!).toBe(false);

    const classic = convertSlideType(poll, 'classic');
    expect(classic.type).toBe('classic');
    expect(classic.title).toBe('Pick one');
    expect(classic.pointsMode).toBe('none');
  });
});


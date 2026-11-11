import type { ClassicContent, PollContent, QuizContent, SlideDraft } from '../schemas/slide';

export interface SlideValidationResult {
  valid: boolean;
  questionError?: string;
  optionErrors: Record<number, string>;
  correctError?: string;
  bodyError?: string;
}

export function validateSlide(slide: SlideDraft): SlideValidationResult {
  const optionErrors: Record<number, string> = {};
  let questionError: string | undefined;
  let correctError: string | undefined;
  let bodyError: string | undefined;

  if (!slide.title.trim()) {
    questionError =
      slide.type === 'classic'
        ? "You haven't added a slide heading."
        : "You haven't added a question.";
  }

  if (slide.type === 'quiz' || slide.type === 'true_false') {
    const content = slide.content as QuizContent;
    const options = content.options ?? [];

    if (slide.type === 'quiz') {
      // At least options 1 and 2 are required; additional added options beyond 4 must also be filled or removed
      for (let i = 0; i < options.length; i++) {
        const text = options[i]?.text.trim() ?? '';
        if (i < 2 && !text) {
          optionErrors[i] = `You haven't added Answer ${i + 1}.`;
        } else if (i >= 4 && !text) {
          optionErrors[i] = `Fill Answer ${i + 1} or remove it.`;
        }
      }

      const filledCount = options.filter((o) => o.text.trim().length > 0).length;
      if (filledCount < 2 && Object.keys(optionErrors).length === 0) {
        optionErrors[0] = "You haven't added Answer 1.";
        optionErrors[1] = "You haven't added Answer 2.";
      }

      const hasValidCorrect = options.some((o) => o.isCorrect && o.text.trim().length > 0);
      if (!hasValidCorrect) {
        correctError = 'Select at least one correct answer.';
      }
    } else {
      // true_false
      if (options.length !== 2) {
        correctError = 'True or false must have exactly 2 options.';
      } else {
        const hasCorrect = options.some((o) => o.isCorrect);
        if (!hasCorrect) {
          correctError = 'Choose whether True or False is correct.';
        }
      }
    }
  } else if (slide.type === 'poll') {
    const content = slide.content as PollContent;
    const options = content.options ?? [];
    if (!options[0]?.text.trim()) {
      optionErrors[0] = "You haven't added Answer 1.";
    }
    if (!options[1]?.text.trim()) {
      optionErrors[1] = "You haven't added Answer 2.";
    }
  } else if (slide.type === 'classic') {
    const content = slide.content as ClassicContent;
    if (!content.body?.trim() && !slide.mediaUrl) {
      bodyError = 'Add slide text or an image.';
    }
  }

  const valid =
    !questionError &&
    !correctError &&
    !bodyError &&
    Object.keys(optionErrors).length === 0;

  return {
    valid,
    questionError,
    optionErrors,
    correctError,
    bodyError,
  };
}

export interface QuizValidationSummary {
  valid: boolean;
  firstInvalidSlideId: string | null;
  bySlideId: Record<string, SlideValidationResult>;
}

export function validateQuiz(slides: SlideDraft[]): QuizValidationSummary {
  const bySlideId: Record<string, SlideValidationResult> = {};
  let firstInvalidSlideId: string | null = null;

  for (const slide of slides) {
    const result = validateSlide(slide);
    bySlideId[slide.id] = result;
    if (!result.valid && !firstInvalidSlideId) {
      firstInvalidSlideId = slide.id;
    }
  }

  return {
    valid: slides.length > 0 && firstInvalidSlideId === null,
    firstInvalidSlideId,
    bySlideId,
  };
}


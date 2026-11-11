import {
  parseSafeVideoEmbed,
  type BigMediaContent,
  type BigTitleContent,
  type BulletPointsContent,
  type ClassicContent,
  type PinAnswerContent,
  type PollContent,
  type PuzzleContent,
  type QuizContent,
  type QuoteContent,
  type ScaleContent,
  type SlideDraft,
  type SliderContent,
  type TypeAnswerContent,
  type VideoContent,
} from '../schemas/slide';

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
      slide.type === 'classic' ||
      slide.type === 'big_title' ||
      slide.type === 'title_text' ||
      slide.type === 'bullet_points' ||
      slide.type === 'quote' ||
      slide.type === 'big_media' ||
      slide.type === 'video'
        ? "You haven't added a slide heading."
        : "You haven't added a question.";
  }

  switch (slide.type) {
    case 'quiz': {
      const options = (slide.content as QuizContent).options ?? [];
      for (let i = 0; i < options.length; i++) {
        const hasTextOrImg =
          Boolean(options[i]?.text.trim()) || Boolean(options[i]?.imageUrl);
        if (i < 2 && !hasTextOrImg) {
          optionErrors[i] = `You haven't added Answer ${i + 1}.`;
        } else if (i >= 4 && !hasTextOrImg) {
          optionErrors[i] = `Fill Answer ${i + 1} or remove it.`;
        }
      }
      const filledCount = options.filter(
        (o) => o.text.trim().length > 0 || Boolean(o.imageUrl)
      ).length;
      if (filledCount < 2 && Object.keys(optionErrors).length === 0) {
        optionErrors[0] = "You haven't added Answer 1.";
        optionErrors[1] = "You haven't added Answer 2.";
      }
      const hasValidCorrect = options.some(
        (o) => o.isCorrect && (o.text.trim().length > 0 || Boolean(o.imageUrl))
      );
      if (!hasValidCorrect) {
        correctError = 'Select at least one correct answer.';
      }
      break;
    }

    case 'true_false': {
      const options = (slide.content as QuizContent).options ?? [];
      if (options.length !== 2 || !options.some((o) => o.isCorrect)) {
        correctError = 'Choose whether True or False is correct.';
      }
      break;
    }

    case 'poll': {
      const options = (slide.content as PollContent).options ?? [];
      if (!options[0]?.text.trim() && !options[0]?.imageUrl) {
        optionErrors[0] = "You haven't added Answer 1.";
      }
      if (!options[1]?.text.trim() && !options[1]?.imageUrl) {
        optionErrors[1] = "You haven't added Answer 2.";
      }
      break;
    }

    case 'type_answer': {
      const content = slide.content as TypeAnswerContent;
      const accepted = (content.acceptedAnswers ?? []).map((a) => a.trim()).filter(Boolean);
      if (accepted.length === 0) {
        correctError = 'Add at least one accepted short answer (max 20 chars).';
      } else if (accepted.some((a) => a.length > 20)) {
        correctError = 'Accepted answers must be 20 characters or fewer.';
      }
      break;
    }

    case 'slider': {
      const content = slide.content as SliderContent;
      if (content.max <= content.min) {
        bodyError = 'Maximum value must be greater than minimum value.';
      } else if (content.step <= 0) {
        bodyError = 'Step must be greater than zero.';
      } else if (
        content.correctValue < content.min ||
        content.correctValue > content.max
      ) {
        correctError = 'Correct value must be within the min–max range.';
      } else if (content.tolerance < 0) {
        correctError = 'Tolerance cannot be negative.';
      }
      break;
    }

    case 'puzzle': {
      const items = (slide.content as PuzzleContent).items ?? [];
      if (items.length !== 4) {
        bodyError = 'Puzzle requires exactly 4 items.';
      } else {
        items.forEach((item, i) => {
          if (!item.text.trim()) {
            optionErrors[i] = `You haven't added Item ${i + 1}.`;
          }
        });
      }
      break;
    }

    case 'scale': {
      const content = slide.content as ScaleContent;
      if (content.max <= content.min) {
        bodyError = 'Scale maximum must exceed minimum.';
      }
      break;
    }

    case 'nps_scale':
    case 'word_cloud':
    case 'open_ended':
    case 'brainstorm':
      break;

    case 'pin_answer': {
      const content = slide.content as PinAnswerContent;
      if (!slide.mediaUrl) {
        bodyError = 'Upload or link an image for Pin answer.';
      } else if (!content.target) {
        correctError = 'Define a target region on the image.';
      } else if (
        content.target.shape === 'circle' &&
        (content.target.radius <= 0.02 || content.target.radius > 0.6)
      ) {
        correctError = 'Circle radius must be between 3% and 60%.';
      } else if (
        content.target.shape === 'polygon' &&
        (content.target.points?.length ?? 0) < 3
      ) {
        correctError = 'Polygon target requires at least 3 corner points.';
      }
      break;
    }

    case 'drop_pin': {
      if (!slide.mediaUrl) {
        bodyError = 'Upload or link an image for Drop pin.';
      }
      break;
    }

    case 'classic':
    case 'title_text': {
      const content = slide.content as ClassicContent;
      if (!content.body?.trim() && !slide.mediaUrl) {
        bodyError = 'Add slide text or an image.';
      }
      break;
    }

    case 'big_title': {
      const content = slide.content as BigTitleContent;
      if (content.subtitle === undefined) {
        bodyError = 'Subtitle missing.';
      }
      break;
    }

    case 'bullet_points': {
      const bullets = ((slide.content as BulletPointsContent).bullets ?? []).filter((b) =>
        b.trim()
      );
      if (bullets.length === 0) {
        bodyError = 'Add at least one bullet point.';
      }
      break;
    }

    case 'quote': {
      const content = slide.content as QuoteContent;
      if (!content.quote?.trim()) {
        bodyError = 'Add a quote.';
      }
      break;
    }

    case 'big_media': {
      const content = slide.content as BigMediaContent;
      if (!slide.mediaUrl && !content.caption?.trim()) {
        bodyError = 'Upload an image for Big Media slide.';
      }
      break;
    }

    case 'video': {
      const content = slide.content as VideoContent;
      if (!parseSafeVideoEmbed(content.videoUrl ?? '')) {
        bodyError = 'Enter a valid HTTPS YouTube or Vimeo video URL.';
      }
      break;
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

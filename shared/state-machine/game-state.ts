import type { GameState } from '../schemas/game';
import type { SlideType } from '../schemas/slide';

export type GameAction = 'start' | 'begin_question' | 'reveal' | 'next' | 'end';

export interface TransitionResult {
  state: GameState;
  slideIndex: number;
}

export class InvalidGameTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGameTransitionError';
  }
}

export function transitionGameState(
  currentState: GameState,
  currentSlideIndex: number,
  slides: ReadonlyArray<{ type: SlideType }>,
  action: GameAction
): TransitionResult {
  if (currentState === 'ended') {
    throw new InvalidGameTransitionError('Game has already ended.');
  }

  if (action === 'end') {
    return { state: 'ended', slideIndex: currentSlideIndex };
  }

  if (slides.length === 0) {
    throw new InvalidGameTransitionError('Cannot run a game with zero slides.');
  }

  const currentSlide = slides[currentSlideIndex];
  const hasNextSlide = currentSlideIndex + 1 < slides.length;

  switch (currentState) {
    case 'lobby': {
      if (action !== 'start') {
        throw new InvalidGameTransitionError(`Action ${action} is not valid in lobby.`);
      }
      return { state: 'question_intro', slideIndex: 0 };
    }

    case 'question_intro': {
      if (action === 'begin_question' || action === 'next') {
        if (currentSlide?.type === 'classic' && action === 'next') {
          return hasNextSlide
            ? { state: 'question_intro', slideIndex: currentSlideIndex + 1 }
            : { state: 'podium', slideIndex: currentSlideIndex };
        }
        return { state: 'question_active', slideIndex: currentSlideIndex };
      }
      throw new InvalidGameTransitionError(`Action ${action} is not valid in question_intro.`);
    }

    case 'question_active': {
      if (action === 'reveal' || action === 'next') {
        if (currentSlide?.type === 'classic') {
          return hasNextSlide
            ? { state: 'question_intro', slideIndex: currentSlideIndex + 1 }
            : { state: 'podium', slideIndex: currentSlideIndex };
        }
        return { state: 'question_reveal', slideIndex: currentSlideIndex };
      }
      throw new InvalidGameTransitionError(`Action ${action} is not valid in question_active.`);
    }

    case 'question_reveal': {
      if (action !== 'next') {
        throw new InvalidGameTransitionError(`Action ${action} is not valid in question_reveal.`);
      }
      const isScored = currentSlide?.type === 'quiz' || currentSlide?.type === 'true_false';
      if (isScored && hasNextSlide) {
        return { state: 'scoreboard', slideIndex: currentSlideIndex };
      }
      return hasNextSlide
        ? { state: 'question_intro', slideIndex: currentSlideIndex + 1 }
        : { state: 'podium', slideIndex: currentSlideIndex };
    }

    case 'scoreboard': {
      if (action !== 'next') {
        throw new InvalidGameTransitionError(`Action ${action} is not valid in scoreboard.`);
      }
      return hasNextSlide
        ? { state: 'question_intro', slideIndex: currentSlideIndex + 1 }
        : { state: 'podium', slideIndex: currentSlideIndex };
    }

    case 'podium': {
      if (action !== 'next') {
        throw new InvalidGameTransitionError(`Action ${action} is not valid in podium.`);
      }
      return { state: 'ended', slideIndex: currentSlideIndex };
    }
  }
}


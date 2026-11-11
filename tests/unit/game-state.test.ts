import { describe, expect, it } from 'vitest';
import {
  InvalidGameTransitionError,
  transitionGameState,
} from '@shared/state-machine/game-state';

describe('Game State Machine (U4)', () => {
  const slides = [{ type: 'quiz' as const }, { type: 'classic' as const }, { type: 'poll' as const }];

  it('walks through full game lifecycle including classic slide skip and podium', () => {
    let cur = transitionGameState('lobby', 0, slides, 'start');
    expect(cur).toEqual({ state: 'question_intro', slideIndex: 0 });

    cur = transitionGameState(cur.state, cur.slideIndex, slides, 'begin_question');
    expect(cur).toEqual({ state: 'question_active', slideIndex: 0 });

    cur = transitionGameState(cur.state, cur.slideIndex, slides, 'reveal');
    expect(cur).toEqual({ state: 'question_reveal', slideIndex: 0 });

    // Scored quiz slide routes to scoreboard when another slide follows
    cur = transitionGameState(cur.state, cur.slideIndex, slides, 'next');
    expect(cur).toEqual({ state: 'scoreboard', slideIndex: 0 });

    cur = transitionGameState(cur.state, cur.slideIndex, slides, 'next');
    expect(cur).toEqual({ state: 'question_intro', slideIndex: 1 });

    // Classic slide advances directly to next slide on reveal/next
    cur = transitionGameState(cur.state, cur.slideIndex, slides, 'begin_question');
    expect(cur).toEqual({ state: 'question_active', slideIndex: 1 });

    cur = transitionGameState(cur.state, cur.slideIndex, slides, 'next');
    expect(cur).toEqual({ state: 'question_intro', slideIndex: 2 });

    // Final poll slide skips scoreboard and routes directly to podium
    cur = transitionGameState(cur.state, cur.slideIndex, slides, 'begin_question');
    cur = transitionGameState(cur.state, cur.slideIndex, slides, 'reveal');
    cur = transitionGameState(cur.state, cur.slideIndex, slides, 'next');
    expect(cur).toEqual({ state: 'podium', slideIndex: 2 });

    cur = transitionGameState(cur.state, cur.slideIndex, slides, 'next');
    expect(cur).toEqual({ state: 'ended', slideIndex: 2 });
  });

  it('rejects invalid transitions and transitions after game ended', () => {
    expect(() => transitionGameState('lobby', 0, slides, 'reveal')).toThrow(
      InvalidGameTransitionError
    );
    expect(() => transitionGameState('ended', 0, slides, 'next')).toThrow(
      InvalidGameTransitionError
    );
  });
});


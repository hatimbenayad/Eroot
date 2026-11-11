import { describe, expect, it } from 'vitest';
import { sanitizeSlideForPlayer } from '@shared/schemas/sanitizer';
import { createDefaultSlide, type PinAnswerContent } from '@shared/schemas/slide';
import {
  aggregateBrainstormIdeas,
  evaluateSlideAnswer,
  isPointInPinTarget,
} from '@shared/scoring/scoring';
import { validateSlide } from '@shared/validation/quiz-validation';

describe('U9 Spatial & Collaborative Slide Types', () => {
  it('validates pin_answer, drop_pin, and brainstorm slides properly', () => {
    const pinSlide = createDefaultSlide('quiz-1', 0, 'pin_answer');
    pinSlide.title = 'Locate the capital city';
    expect(validateSlide(pinSlide).valid).toBe(false);

    pinSlide.mediaUrl = 'https://example.com/map.png';
    expect(validateSlide(pinSlide).valid).toBe(true);

    pinSlide.content = {
      target: { shape: 'polygon', points: [{ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 }] },
    };
    expect(validateSlide(pinSlide).valid).toBe(false);

    const dropSlide = createDefaultSlide('quiz-1', 1, 'drop_pin');
    dropSlide.title = 'Where would you camp?';
    expect(validateSlide(dropSlide).valid).toBe(false);
    dropSlide.mediaUrl = 'https://example.com/park.png';
    expect(validateSlide(dropSlide).valid).toBe(true);

    const brainstorm = createDefaultSlide('quiz-1', 2, 'brainstorm');
    brainstorm.title = 'Ways to cut office energy use';
    expect(validateSlide(brainstorm).valid).toBe(true);
  });

  it('strips pin_answer target geometry when sanitizing for players', () => {
    const pinSlide = createDefaultSlide('quiz-1', 0, 'pin_answer');
    pinSlide.title = 'Pin Madrid';
    pinSlide.mediaUrl = 'https://example.com/spain.png';
    pinSlide.content = {
      target: { shape: 'circle', cx: 0.48, cy: 0.49, radius: 0.1 },
      hint: 'Center of Spain',
    } satisfies PinAnswerContent;

    const pub = sanitizeSlideForPlayer(pinSlide);
    expect(pub.pinConfig).toEqual({ hasTarget: true, hint: 'Center of Spain' });
    expect((pub as unknown as { content?: unknown }).content).toBeUndefined();
    expect(JSON.stringify(pub)).not.toContain('0.48');
  });

  it('evaluates circle and polygon pin targets accurately and scores drop_pin as opinion', () => {
    const circleSlide = createDefaultSlide('quiz-1', 0, 'pin_answer');
    circleSlide.timeLimit = 20;
    circleSlide.pointsMode = 'standard';
    circleSlide.mediaUrl = 'https://example.com/board.png';
    circleSlide.content = {
      target: { shape: 'circle', cx: 0.5, cy: 0.5, radius: 0.15 },
    };

    const hit = evaluateSlideAnswer(circleSlide, { pin: { x: 0.55, y: 0.52 } }, 0);
    expect(hit).toEqual({ validOption: true, isCorrect: true, points: 1000 });

    const miss = evaluateSlideAnswer(circleSlide, { pin: { x: 0.9, y: 0.9 } }, 1000);
    expect(miss).toEqual({ validOption: true, isCorrect: false, points: 0 });

    const polyTarget = {
      shape: 'polygon' as const,
      points: [
        { x: 0.2, y: 0.2 },
        { x: 0.8, y: 0.2 },
        { x: 0.8, y: 0.8 },
        { x: 0.2, y: 0.8 },
      ],
    };
    expect(isPointInPinTarget({ x: 0.5, y: 0.5 }, polyTarget)).toBe(true);
    expect(isPointInPinTarget({ x: 0.1, y: 0.5 }, polyTarget)).toBe(false);

    const dropSlide = createDefaultSlide('quiz-1', 1, 'drop_pin');
    expect(evaluateSlideAnswer(dropSlide, { pin: { x: 0.3, y: 0.4 } }, 3000)).toEqual({
      validOption: true,
      isCorrect: null,
      points: 0,
    });
  });

  it('aggregates brainstorm ideas and ranks by upvotes with per-player limits', () => {
    const brainstormSlide = createDefaultSlide('quiz-1', 0, 'brainstorm');
    expect(evaluateSlideAnswer(brainstormSlide, { text: 'Solar roof tiles' }, 1500)).toEqual({
      validOption: true,
      isCorrect: null,
      points: 0,
    });

    const ranked = aggregateBrainstormIdeas([
      {
        playerId: 'p1',
        nickname: 'Ada',
        payload: {
          ideas: ['Smart thermostats', 'Bike racks', 'LED bulbs', 'Extra ignored idea'],
          votedIdeaIds: ['p2:0'],
        },
      },
      {
        playerId: 'p2',
        nickname: 'Linus',
        payload: {
          ideas: ['Compost bins'],
          votedIdeaIds: ['p1:1', 'p2:0'],
        },
      },
      {
        playerId: 'p3',
        nickname: 'Grace',
        payload: {
          votedIdeaIds: ['p2:0', 'p2:0'], // duplicate vote ignored
        },
      },
    ]);

    expect(ranked).toHaveLength(4);
    expect(ranked[0]).toMatchObject({
      id: 'p2:0',
      text: 'Compost bins',
      authorNickname: 'Linus',
      votes: 3,
    });
    expect(ranked[1]).toMatchObject({
      id: 'p1:1',
      text: 'Bike racks',
      votes: 1,
    });
  });
});


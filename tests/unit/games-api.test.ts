import { describe, expect, it } from 'vitest';
import {
  buildPublicGamePayload,
  computeScoreboard,
  generateGamePin,
  shuffleArray,
  type DbGameRow,
  type DbPlayerRow,
} from '../../api/_lib/game-helpers';
import {
  gameOptionsSchema,
  joinGameRequestSchema,
  submitAnswerRequestSchema,
} from '@shared/schemas/game';

describe('U4 API helpers and request schemas', () => {
  it('generates 7-digit numeric PINs and shuffles without dropping items', () => {
    const pin = generateGamePin();
    expect(pin).toMatch(/^\d{7}$/);

    const source = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(source);
    expect(shuffled).toHaveLength(5);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(source);
  });

  it('ranks active players by total_score desc then earliest join and excludes kicked players', () => {
    const players: DbPlayerRow[] = [
      {
        id: 'p1',
        game_id: 'g1',
        nickname: 'LateTie',
        identifier: null,
        session_token: 't1',
        total_score: 900,
        streak: 1,
        is_kicked: false,
        joined_at: '2026-11-11T10:02:00Z',
      },
      {
        id: 'p2',
        game_id: 'g1',
        nickname: 'EarlyTie',
        identifier: null,
        session_token: 't2',
        total_score: 900,
        streak: 1,
        is_kicked: false,
        joined_at: '2026-11-11T10:01:00Z',
      },
      {
        id: 'p3',
        game_id: 'g1',
        nickname: 'KickedLeader',
        identifier: null,
        session_token: 't3',
        total_score: 2000,
        streak: 2,
        is_kicked: true,
        joined_at: '2026-11-11T10:00:00Z',
      },
    ];

    const ranked = computeScoreboard(players);
    expect(ranked.map((r) => r.nickname)).toEqual(['EarlyTie', 'LateTie']);
    expect(ranked[0]?.rank).toBe(1);
    expect(ranked[1]?.rank).toBe(2);
  });

  it('strips reveal_payload whenever game state is not question_reveal', () => {
    const gameRow: DbGameRow = {
      id: 'g1',
      pin: '1234567',
      host_id: 'h1',
      quiz_id: 'q1',
      mode: 'classic',
      state: 'question_active',
      current_slide_index: 0,
      question_started_at: '2026-11-11T10:00:00Z',
      settings: gameOptionsSchema.parse({}),
      theme_id: 'indigo-stage',
      quiz_title: 'Demo',
      max_players: 100,
      public_slides: [],
      reveal_payload: {
        slideId: 's1',
        correctOptionIds: ['opt-1'],
        optionCounts: {},
        totalAnswers: 0,
      },
    };

    const payload = buildPublicGamePayload(gameRow, [], 0);
    expect(payload.revealPayload).toBeNull();
    expect(payload.maxPlayers).toBe(100);
  });

  it('validates join and answer request schemas', () => {
    expect(joinGameRequestSchema.safeParse({ pin: '12345', nickname: 'Ada' }).success).toBe(false);
    expect(joinGameRequestSchema.safeParse({ pin: '1234567', nickname: 'Ada' }).success).toBe(true);
    expect(
      submitAnswerRequestSchema.safeParse({
        gameId: '550e8400-e29b-41d4-a716-446655440000',
        slideId: 's1',
        optionId: 'o1',
      }).success
    ).toBe(true);
  });
});


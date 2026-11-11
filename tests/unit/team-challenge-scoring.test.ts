import { describe, expect, it } from 'vitest';
import { computeTeamStandings } from '@shared/scoring/team';
import { calculateSpeedPoints, evaluateSlideAnswer } from '@shared/scoring/scoring';
import { createDefaultSlide, type QuizContent } from '@shared/schemas/slide';

describe('U8 Team Mode & Challenge Accuracy-Only Scoring', () => {
  it('computes team question scores as average of active members per question', () => {
    const teams = [
      { id: 't1', name: 'Crimson Foxes', colorHex: '#dc2626', position: 0 },
      { id: 't2', name: 'Cobalt Owls', colorHex: '#2563eb', position: 1 },
      { id: 't3', name: 'Empty Team', colorHex: '#eab308', position: 2 },
    ];
    const players = [
      { id: 'p1', team_id: 't1', is_kicked: false },
      { id: 'p2', team_id: 't1', is_kicked: false },
      { id: 'p3', team_id: 't2', is_kicked: false },
      { id: 'p4', team_id: 't2', is_kicked: true }, // kicked excluded
    ];
    const answers = [
      { player_id: 'p1', slide_id: 's1', points: 1000 },
      { player_id: 'p2', slide_id: 's1', points: 600 },
      { player_id: 'p3', slide_id: 's1', points: 900 },
      { player_id: 'p4', slide_id: 's1', points: 1000 },
    ];

    const standings = computeTeamStandings(teams, players, answers);
    expect(standings[0]?.teamId).toBe('t2');
    expect(standings[0]?.totalScore).toBe(900);
    expect(standings[1]?.teamId).toBe('t1');
    expect(standings[1]?.totalScore).toBe(800);
    expect(standings[2]?.totalScore).toBe(0);
  });

  it('awards full maxPoints in challenge accuracyOnly mode regardless of responseMs', () => {
    expect(
      calculateSpeedPoints({
        isCorrect: true,
        pointsMode: 'standard',
        responseMs: 19_500,
        questionMs: 20_000,
        accuracyOnly: true,
      })
    ).toBe(1000);

    const quiz = createDefaultSlide('q1', 0, 'quiz');
    const opts = (quiz.content as QuizContent).options;
    opts[0]!.text = 'Yes';
    opts[0]!.isCorrect = true;
    opts[1]!.text = 'No';

    expect(
      evaluateSlideAnswer(quiz, { optionId: opts[0]!.id }, 19_000, { accuracyOnly: true })
    ).toEqual({
      validOption: true,
      isCorrect: true,
      points: 1000,
    });
  });
});


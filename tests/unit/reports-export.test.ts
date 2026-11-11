import { describe, expect, it } from 'vitest';
import {
  buildReportCsv,
  buildReportXlsxBuffer,
  escapeSpreadsheetCell,
} from '@/features/reports/export';
import { computeReportAnalytics } from '@shared/reports/analytics';
import { createDefaultSlide, type QuizContent } from '@shared/schemas/slide';

describe('Report CSV & XLSX Export (U6)', () => {
  it('escapes leading formula characters to prevent spreadsheet injection', () => {
    expect(escapeSpreadsheetCell('=cmd|calc')).toBe("'=cmd|calc");
    expect(escapeSpreadsheetCell('+123')).toBe("'+123");
    expect(escapeSpreadsheetCell('-123')).toBe("'-123");
    expect(escapeSpreadsheetCell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(escapeSpreadsheetCell('SafeName')).toBe('SafeName');
  });

  it('builds valid CSV and XLSX bytes for report analytics', async () => {
    const s = createDefaultSlide('q1', 0, 'quiz');
    s.id = 's1';
    s.title = 'Capital?';
    (s.content as QuizContent).options[0]!.text = 'Rabat';
    (s.content as QuizContent).options[0]!.isCorrect = true;
    (s.content as QuizContent).options[1]!.text = 'Fes';

    const analytics = computeReportAnalytics(
      [s],
      [
        {
          id: 'p1',
          nickname: '=EVIL',
          identifier: 'student-1',
          total_score: 950,
          streak: 1,
          is_kicked: false,
          joined_at: '2026-11-11T10:00:00Z',
        },
      ],
      [
        {
          id: 'a1',
          player_id: 'p1',
          slide_id: 's1',
          payload: { optionId: (s.content as QuizContent).options[0]!.id },
          response_ms: 1200,
          points: 950,
          is_correct: true,
        },
      ]
    );

    const csv = buildReportCsv('Geography Report', analytics);
    expect(csv).toContain("'=EVIL");
    expect(csv).toContain('student-1');

    const xlsxBytes = await buildReportXlsxBuffer('Geography Report', analytics);
    // PK zip magic header
    expect(xlsxBytes[0]).toBe(0x50);
    expect(xlsxBytes[1]).toBe(0x4b);
  });
});

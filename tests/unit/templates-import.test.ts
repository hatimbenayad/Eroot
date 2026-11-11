import { describe, expect, it } from 'vitest';
import { STARTER_TEMPLATES } from '@shared/constants/templates';
import {
  buildImportTemplateCsv,
  parseCsvText,
  parseImportedGrid,
} from '@shared/import/spreadsheet';
import { validateQuiz } from '@shared/validation/quiz-validation';

describe('U7 Starter Templates & Spreadsheet Import', () => {
  it('all 5 starter templates pass strict quiz validation', () => {
    expect(STARTER_TEMPLATES).toHaveLength(5);
    for (const tpl of STARTER_TEMPLATES) {
      const slides = tpl.buildSlides(tpl.id);
      const summary = validateQuiz(slides);
      expect(summary.valid, `Template ${tpl.id} failed validation`).toBe(true);
    }
  });

  it('parses valid template CSV rows and flags invalid rows with line numbers', () => {
    const csv = buildImportTemplateCsv();
    const grid = parseCsvText(csv);
    const okResult = parseImportedGrid('quiz-1', grid);
    expect(okResult.errors).toEqual([]);
    expect(okResult.validSlides).toHaveLength(3);
    expect(okResult.validSlides[0]?.type).toBe('quiz');
    expect(okResult.validSlides[1]?.type).toBe('true_false');
    expect(okResult.validSlides[2]?.type).toBe('poll');

    // Add an invalid row (missing question)
    const badGrid = [...grid, ['Quiz', '', 'A', 'B', '', '', '20', '1']];
    const mixed = parseImportedGrid('quiz-1', badGrid);
    expect(mixed.validSlides).toHaveLength(3);
    expect(mixed.errors).toEqual([{ rowNumber: 5, message: "You haven't added a question." }]);
  });
});


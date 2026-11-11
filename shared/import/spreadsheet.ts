import {
  createDefaultSlide,
  TIME_LIMITS,
  type PollContent,
  type QuizContent,
  type SlideDraft,
  type TimeLimit,
} from '../schemas/slide';
import { validateSlide } from '../validation/quiz-validation';

export interface ImportedRowInput {
  type: string;
  question: string;
  answer1: string;
  answer2: string;
  answer3?: string;
  answer4?: string;
  timeLimit?: string | number;
  correct?: string;
}

export interface ImportParseError {
  rowNumber: number;
  message: string;
}

export interface ImportParseResult {
  validSlides: SlideDraft[];
  errors: ImportParseError[];
}

export const MAX_IMPORT_ROWS = 100;

export const TEMPLATE_SAMPLE_ROWS: readonly string[][] = [
  [
    'Type',
    'Question',
    'Answer 1',
    'Answer 2',
    'Answer 3',
    'Answer 4',
    'Time limit (sec)',
    'Correct answer(s)',
  ],
  ['Quiz', 'What is the capital of Morocco?', 'Rabat', 'Casablanca', 'Marrakesh', 'Tangier', '20', '1'],
  ['True or false', 'TypeScript compiles to JavaScript.', 'True', 'False', '', '', '20', 'True'],
  ['Poll', 'Preferred session length?', '15 min', '30 min', '45 min', '60 min', '30', ''],
];

function normalizeTimeLimit(raw: string | number | undefined): TimeLimit {
  const num = Number(raw);
  if ((TIME_LIMITS as readonly number[]).includes(num)) {
    return num as TimeLimit;
  }
  return 20;
}

export function parseCsvText(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i]!;
    if (inQuotes) {
      if (ch === '"' && csvText[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field.trim());
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && csvText[i + 1] === '\n') i += 1;
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

export function parseImportedGrid(
  quizId: string,
  grid: string[][],
  startPosition = 0
): ImportParseResult {
  if (grid.length < 2) {
    return {
      validSlides: [],
      errors: [{ rowNumber: 1, message: 'Spreadsheet must include a header row and at least one question row.' }],
    };
  }

  const headers = grid[0]!.map((h) => h.toLowerCase());
  const qCol = headers.findIndex((h) => h.includes('question'));
  const a1Col = headers.findIndex((h) => h.includes('answer 1'));
  const a2Col = headers.findIndex((h) => h.includes('answer 2'));

  if (qCol === -1 || a1Col === -1 || a2Col === -1) {
    return {
      validSlides: [],
      errors: [
        {
          rowNumber: 1,
          message: 'Missing required columns: Question, Answer 1, Answer 2.',
        },
      ],
    };
  }

  const typeCol = headers.findIndex((h) => h.includes('type'));
  const a3Col = headers.findIndex((h) => h.includes('answer 3'));
  const a4Col = headers.findIndex((h) => h.includes('answer 4'));
  const timeCol = headers.findIndex((h) => h.includes('time'));
  const correctCol = headers.findIndex((h) => h.includes('correct'));

  const dataRows = grid.slice(1, MAX_IMPORT_ROWS + 1);
  const validSlides: SlideDraft[] = [];
  const errors: ImportParseError[] = [];

  dataRows.forEach((cells, idx) => {
    const rowNumber = idx + 2;
    const rawType = (typeCol >= 0 ? cells[typeCol] : 'quiz')?.toLowerCase().trim() || 'quiz';
    const question = (cells[qCol] ?? '').trim();
    const a1 = (cells[a1Col] ?? '').trim();
    const a2 = (cells[a2Col] ?? '').trim();
    const a3 = a3Col >= 0 ? (cells[a3Col] ?? '').trim() : '';
    const a4 = a4Col >= 0 ? (cells[a4Col] ?? '').trim() : '';
    const timeLimit = normalizeTimeLimit(timeCol >= 0 ? cells[timeCol] : 20);
    const correctRaw = (correctCol >= 0 ? cells[correctCol] : '1')?.trim() ?? '';

    const pos = startPosition + validSlides.length;

    let slide: SlideDraft;
    if (rawType.includes('true')) {
      slide = createDefaultSlide(quizId, pos, 'true_false');
      slide.title = question;
      slide.timeLimit = timeLimit;
      const lower = correctRaw.toLowerCase();
      const isTrue = lower === 'true' || lower === '1' || lower === 'yes';
      const opts = (slide.content as QuizContent).options;
      opts[0]!.isCorrect = isTrue;
      opts[1]!.isCorrect = !isTrue;
    } else if (rawType.includes('poll')) {
      slide = createDefaultSlide(quizId, pos, 'poll');
      slide.title = question;
      slide.timeLimit = timeLimit;
      const opts = (slide.content as PollContent).options;
      opts[0]!.text = a1;
      opts[1]!.text = a2;
      opts[2]!.text = a3;
      opts[3]!.text = a4;
    } else {
      slide = createDefaultSlide(quizId, pos, 'quiz');
      slide.title = question;
      slide.timeLimit = timeLimit;
      const correctIndices = new Set(
        correctRaw
          .split(/[,;\s]+/)
          .map((s) => Number(s))
          .filter((n) => n >= 1 && n <= 4)
      );
      const opts = (slide.content as QuizContent).options;
      opts[0]!.text = a1;
      opts[1]!.text = a2;
      opts[2]!.text = a3;
      opts[3]!.text = a4;
      opts.forEach((o, i) => {
        o.isCorrect = correctIndices.has(i + 1);
      });
    }

    const check = validateSlide(slide);
    if (!check.valid) {
      const firstErr =
        check.questionError ||
        check.optionErrors[0] ||
        check.optionErrors[1] ||
        check.correctError ||
        'Invalid question row.';
      errors.push({ rowNumber, message: firstErr });
      return;
    }

    validSlides.push(slide);
  });

  return { validSlides, errors };
}

export function buildImportTemplateCsv(): string {
  return TEMPLATE_SAMPLE_ROWS.map((row) =>
    row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\r\n');
}


import type { ReportAnalytics } from '@shared/reports/analytics';

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function escapeSpreadsheetCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return FORMULA_PREFIX.test(str) ? `'${str}` : str;
}

function csvQuote(cell: string): string {
  const escaped = escapeSpreadsheetCell(cell).replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildReportCsv(title: string, analytics: ReportAnalytics): string {
  const lines: string[] = [];
  lines.push([csvQuote('Eroot Report'), csvQuote(title)].join(','));
  lines.push(
    [
      csvQuote('Players'),
      csvQuote(String(analytics.playerCount)),
      csvQuote('Avg Accuracy %'),
      csvQuote(`${analytics.avgAccuracyPercent}%`),
      csvQuote('Avg Time (s)'),
      csvQuote(String(analytics.avgResponseSec)),
    ].join(',')
  );
  lines.push('');

  lines.push(
    [
      csvQuote('Rank'),
      csvQuote('Nickname'),
      csvQuote('Identifier'),
      csvQuote('Total Score'),
      csvQuote('Accuracy %'),
      csvQuote('Answered'),
      ...analytics.questions.map((q) => csvQuote(`Q${q.index}: ${q.title}`)),
    ].join(',')
  );

  for (const player of analytics.players) {
    lines.push(
      [
        csvQuote(String(player.rank)),
        csvQuote(player.nickname),
        csvQuote(player.identifier ?? ''),
        csvQuote(String(player.totalScore)),
        csvQuote(`${player.accuracyPercent}%`),
        csvQuote(`${player.answeredCount}/${analytics.questionCount}`),
        ...analytics.questions.map((q) => {
          const ans = player.answersBySlideId[q.slideId];
          if (!ans) return csvQuote('—');
          if (ans.isCorrect === true) return csvQuote(`Correct (+${ans.points})`);
          if (ans.isCorrect === false) return csvQuote('Incorrect (0)');
          return csvQuote('Submitted');
        }),
      ].join(',')
    );
  }

  return lines.join('\r\n');
}

export async function buildReportXlsxBuffer(
  title: string,
  analytics: ReportAnalytics
): Promise<Uint8Array> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Eroot';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['Report Title', escapeSpreadsheetCell(title)]);
  summarySheet.addRow(['Total Players', analytics.playerCount]);
  summarySheet.addRow(['Interactive Questions', analytics.questionCount]);
  summarySheet.addRow(['Average Accuracy (%)', analytics.avgAccuracyPercent]);
  summarySheet.addRow(['Average Response Time (s)', analytics.avgResponseSec]);
  summarySheet.addRow(['Difficult Questions (<35%)', analytics.difficultQuestions.length]);
  summarySheet.addRow(['Players Needing Help (<50%)', analytics.playersNeedingHelp.length]);
  summarySheet.addRow(['Did Not Finish', analytics.unfinishedPlayers.length]);

  const playersSheet = workbook.addWorksheet('Players');
  playersSheet.addRow([
    'Rank',
    'Nickname',
    'Identifier',
    'Total Score',
    'Accuracy (%)',
    'Answered',
    'Needs Help',
    'Did Not Finish',
  ]);
  for (const p of analytics.players) {
    playersSheet.addRow([
      p.rank,
      escapeSpreadsheetCell(p.nickname),
      escapeSpreadsheetCell(p.identifier),
      p.totalScore,
      p.accuracyPercent,
      p.answeredCount,
      p.needsHelp ? 'Yes' : 'No',
      p.didNotFinish ? 'Yes' : 'No',
    ]);
  }

  const questionsSheet = workbook.addWorksheet('Questions');
  questionsSheet.addRow([
    '#',
    'Type',
    'Question',
    'Answered',
    'Correct %',
    'Avg Time (s)',
    'Difficult (<35%)',
    'Text Responses',
  ]);
  for (const q of analytics.questions) {
    questionsSheet.addRow([
      q.index,
      q.type,
      escapeSpreadsheetCell(q.title),
      q.answeredCount,
      q.isScored ? q.correctPercent : 'N/A',
      q.avgResponseSec,
      q.isDifficult ? 'Yes' : 'No',
      escapeSpreadsheetCell(q.textResponses.join(' | ')),
    ]);
  }

  const buf = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buf);
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safeSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'eroot-report'
  );
}

export function downloadReportCsv(title: string, analytics: ReportAnalytics): void {
  const csv = buildReportCsv(title, analytics);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerBrowserDownload(blob, `${safeSlug(title)}.csv`);
}

export async function downloadReportXlsx(title: string, analytics: ReportAnalytics): Promise<void> {
  const bytes = await buildReportXlsxBuffer(title, analytics);
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBrowserDownload(blob, `${safeSlug(title)}.xlsx`);
}

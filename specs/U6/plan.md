# Unit U6 Implementation Plan

1. **Install `exceljs`** (or lightweight `.xlsx` builder) dynamically imported on export so player bundles stay small.
2. **Pure Analytics & Export Helpers (`#42`, `#43`):**
   - `shared/reports/analytics.ts`: `computeReportAnalytics(snapshotSlides, players, answers)` calculating summary stats, `<35%` difficult questions, `<50%` needs-help players, unfinished players, per-player breakdown, and per-question breakdown.
   - `src/features/reports/export.ts`: `escapeSpreadsheetCell()`, `buildReportCsv()`, and `downloadReportXlsx()` (Summary, Players, Questions worksheets).
3. **Data Layer (`#41`, `#44`):**
   - `src/features/reports/api.ts`: `fetchReportsList`, `renameReport`, `deleteReport`, `fetchReportDetail` (loads `reports`, `games`, `game_snapshots`, `players`, `answers` via Supabase RLS), and `createDifficultQuestionsQuiz` (inserts new `quizzes` + copied difficult `slides` rows).
4. **UI (`#41`, `#42`, `#43`, `#44`):**
   - `src/features/reports/ReportsPage.tsx`: Search, filter (mode/date), sort, rename modal, delete modal, click into `/reports/:reportId`.
   - `src/features/reports/ReportDetailPage.tsx`: Summary, Players, Questions tabs, Podium Replay dialog, `.xlsx`/`.csv` download buttons, `Play Again` (`GameOptionsModal`), and `Practice Difficult Questions (>=3)`.
   - Wire `/reports/:reportId` in `src/app/App.tsx`.
5. **Tests:**
   - Vitest unit tests for `computeReportAnalytics` (`<35%` difficult threshold, zero-division safety, needs-help, unfinished, identifier preservation), `escapeSpreadsheetCell` / `buildReportCsv`, and `ReportDetailPage` integration test!


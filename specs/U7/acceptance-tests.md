# Unit U7 Acceptance Tests

Traceability: `US-009` (`#46`), `FR-005`, `FR-070`–`FR-073`.

## AT-U7-01 — 5 Starter Templates Pass Strict Quiz Validation
- **Given** the 5 built-in starter templates in `shared/constants/templates.ts`
- **When** each template's slides are checked with `validateQuiz()`
- **Then** all 5 starter templates are 100% valid and ready to edit or host immediately.

## AT-U7-02 — Spreadsheet Template Round-Trip & Row Validation
- **Given** the downloadable `.xlsx` and `.csv` templates populated with Quiz, True/False, and Poll rows plus 1 invalid row missing Answer 1
- **When** parsed via `parseImportedRows` / `parseImportedXlsx`
- **Then** valid rows convert into valid `SlideDraft` objects and the invalid row reports a clear row-numbered validation error.

## AT-U7-03 — Creator `Find` & `Import` Tabs Insert Slides
- **Given** `AddSlideModal` opened in Creator
- **When** the creator searches `"capital"` on the `Find` tab and clicks `Insert`
- **Then** the matched question is appended as a fresh slide in the current quiz.

# Unit U6 Acceptance Tests

Traceability: `US-008` (`#40`), `FR-060`–`FR-065`.

## AT-U6-01 — Reports List Search, Filter, Rename & Delete
- **Given** multiple historical reports on `/reports`
- **When** the host filters by `live`, searches by title, renames a report, or deletes one
- **Then** the UI updates cleanly and persists changes via Supabase.

## AT-U6-02 — Difficult Questions (<35%), Needs Help & Unfinished Detection
- **Given** a 4-question game where Q1 has 20% correct, Q2 has 30% correct, Q3 has 34% correct, Q4 has 80% correct
- **When** `computeReportAnalytics` runs
- **Then** Q1, Q2, and Q3 appear in `difficultQuestions` (`3 >= 3`), enabling `Practice Difficult Questions`.

## AT-U6-03 — Formula Injection Escaping on CSV / XLSX Export
- **Given** a player nickname `=cmd|' /C calc'!A0` or open-ended answer `+1+1`
- **When** exported via `buildReportCsv` / `downloadReportXlsx`
- **Then** dangerous leading formula characters (`=`, `+`, `-`, `@`) are escaped with `'`.

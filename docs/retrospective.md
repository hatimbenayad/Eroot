# Eroot Delivery Retrospective

## What Went Well

1. **Spec-Driven Traceability (U1–U10):** Writing `spec.md`, `plan.md`, `tasks.md`, and `acceptance-tests.md` prior to coding each unit prevented drift between UI surfaces, database RLS policies, and API contracts.
2. **Unified `shared/` Domain Kernel:** Sharing Zod schemas, `sanitizeSlideForPlayer`, `evaluateSlideAnswer`, team standings math, and the state machine across React (`src/`) and Vercel Functions (`api/`) eliminated client/server scoring mismatches and kept unit testing fast (`< 12s` across 20 test suites).
3. **Consolidation Under Vercel Hobby Limits:** Consolidating self-paced challenge actions (`api/challenges/index.ts`, `api/challenges/play.ts`) and routing two-phase Brainstorm upvoting + spatial Pin Answer scoring through existing endpoints (`api/games/answer.ts`, `api/games/state.ts`) kept total serverless functions at **10** (under the 12-function Hobby cap) without sacrificing features.
4. **Accessibility & Performance Discipline:** Catching colour-contrast ratios on primary tiles (`#15803d`, `#0f766e`), label-content mismatches on `AnswerTile`, and lazy-splitting Creator/Host/Reports chunks dropped initial JS entry size by ~45% (`867 kB -> 473.5 kB`) while keeping `axe-core` critical/serious violations at zero.

## Challenges & Lessons Learned

- **Supabase Realtime REST Fan-Out:** Server-side Vercel Functions cannot open persistent WebSocket subscriptions reliably within request budgets; switching `broadcastGameEvent` to Supabase Realtime's HTTP broadcast helper (`httpSend` + `removeChannel`) made broadcasts stateless and deterministic.
- **CSV/XLSX Formula Injection Safety:** Exporting free-text player identifiers and open-ended responses directly into spreadsheets creates formula injection risk; centralizing `escapeSpreadsheetCell` (`'` prefix on `=`, `+`, `-`, `@`, tab, CR) neutralizes spreadsheet formula execution.
- **TypeScript + Joined Queries:** Supabase PostgREST relationship types can infer arrays vs single objects depending on foreign-key hints; defensive runtime array normalization avoided fragile runtime crashes in Report Analytics.

## Deferred Future Backlog (`Post-v1.0.0`)

Captured in `docs/inception/backlog.md`:
- **Future #64:** Themed arcade game modes (Robot Run, Treasure Trove, Color Kingdoms, Tallest Tower, Submarine Squad, Rocket Race).
- **Future #65:** Auto-play host pacing mode.
- **Future #66:** Real-time quiz collaborators via email invite.
- **Future #67:** Additional UI languages (French, Arabic).


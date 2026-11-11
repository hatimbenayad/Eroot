# Unit U1 Tasks

Mapped to `docs/inception/backlog.md` Epic `#1` and Story `#2`:

- [ ] **#3** `chore(u1): scaffold Vite + React 18 + TS + Tailwind + Radix + ESLint/Prettier + Vitest/Playwright`
  - Files: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `.eslintrc.cjs` / `eslint.config.js`, `.prettierrc`, `index.html`, `.gitignore`.
  - Verify: `npm run typecheck`, `npm run lint`, `npm run build` succeed.
- [ ] **#4** `feat(u1): implement Eroot design system tokens, geometric shape+colour tile primitives, and i18n dictionary scaffold (en)`
  - Files: `src/styles/tokens.css`, `src/styles/index.css`, `src/components/ui/*`, `src/components/eroot/*`, `src/i18n/*`, `tests/unit/answer-tile.test.tsx`, `tests/unit/i18n.test.ts`.
  - Verify: Unit tests for `AnswerTile` and `i18n` pass.
- [ ] **#5** `feat(u1): add initial Supabase Postgres migrations, RLS policies, and Storage bucket setup`
  - Files: `supabase/migrations/0001_u1_core.sql`, `supabase/config.toml` (minimal local reference if needed).
  - Verify: SQL syntax audited (valid Postgres DDL, RLS policies, triggers, Storage policies).
- [ ] **#6** `feat(u1): implement email/password Auth flow, protected route guards, and /api/health endpoint`
  - Files: `src/lib/supabase.ts`, `src/features/auth/*`, `src/app/*`, `api/health.ts`, `tests/unit/auth-schema.test.ts`, `tests/unit/health.test.ts`, `tests/e2e/u1-foundation.spec.ts`.
  - Verify: Unit tests and Playwright U1 acceptance + axe accessibility tests pass.
- [ ] **#7** `chore(u1): configure Vercel deployment (vercel.json, .env.example) and CI lint/typecheck/unit checks`
  - Files: `vercel.json`, `.env.example`, `.github/workflows/ci.yml`, `docs/inception/backlog.md` (mark `#1`–`#7` done).
  - Verify: Full `npm run typecheck && npm run lint && npm test && npm run build` passes cleanly; pushed to `origin/main`.

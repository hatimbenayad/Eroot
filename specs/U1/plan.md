# Unit U1 Implementation Plan

## 1. Approach

1. **Bootstrap & Tooling (`#3`):**
   - Initialize `package.json` with `"type": "module"`, React 18, Vite, TypeScript (`tsconfig.json`, `tsconfig.node.json`), Tailwind CSS, PostCSS, ESLint, Prettier, Vitest, Testing Library, and Playwright.
   - Configure path aliases (`@/` -> `src/`, `@shared/` -> `shared/`) in `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts`. Note: Vercel Functions under `api/` use relative imports (`../shared/...`) so `@vercel/node` resolves them cleanly without custom loaders.
2. **Design System & i18n (`#4`):**
   - Create `src/styles/tokens.css` & `tailwind.config.ts` defining Eroot light Creator tokens, deep indigo/slate Host Stage tokens, and WCAG AA verified tile colours.
   - Build `src/components/ui/*` (Button, Input, Card, Label, Tabs, Dialog, Alert) and `src/components/eroot/*` (`ErootLogo`, `AnswerShapeIcon`, `AnswerTile`, `HostStageShell`).
   - Implement `shared/i18n/types.ts` and `src/i18n/en.ts` + `src/i18n/index.tsx` (`useTranslation`).
3. **Database & Storage Migrations (`#5`):**
   - Write `supabase/migrations/0001_u1_core.sql` with `profiles`, `quizzes`, `slides`, `media_assets`, triggers, RLS policies, and `quiz-media` Storage bucket & policies.
4. **Auth, Routes & `/api/health` (`#6`):**
   - Build `src/lib/supabase.ts` with safe env checking.
   - Build `src/features/auth/` (`AuthProvider`, `RequireAuth`, `AuthPage` with Zod + `react-hook-form`).
   - Build `src/app/App.tsx` with routes (`/`, `/auth`, `/library`, `/join`, `*` 404) wrapped in `QueryClientProvider` and `MotionConfig reducedMotion="user"`.
   - Implement `api/health.ts` (Vercel Function handler) + unit-testable `checkHealth()` helper.
5. **Vercel & CI Config (`#7`):**
   - Create `vercel.json` (SPA rewrite excluding `/api/(.*)`), `.env.example`, `.gitignore`, and `.github/workflows/ci.yml` (typecheck, lint, unit tests, build).

## 2. Risks & Mitigations

- **Vercel Function module resolution:** Use explicit relative imports (`../shared/...`) inside `api/` and verify `tsc --noEmit` covers `api/`, `shared/`, and `src/`.
- **Yellow tile contrast:** Enforce `#0f172a` dark text/icon on `#eab308` yellow tiles and verify programmatically/visually.
- **Unconfigured Supabase env in CI / tests:** Abstract Supabase client initialization cleanly so unit tests and Playwright UI smoke tests work with mocked/unconfigured env without crashing.

## 3. Test Strategy

- **Unit tests (Vitest + RTL):**
  - `AnswerTile` renders shape + colour + label (`A–F`) and handles click/disabled states.
  - `i18n` `t()` resolves nested keys cleanly.
  - Auth form Zod validation rejects invalid emails and short passwords (`< 8` chars).
  - `api/health` handler returns `503` when DB env is missing and `200` when mocked Supabase query succeeds.
- **E2E + Accessibility (Playwright + axe):**
  - Landing (`/`) -> Auth (`/auth`) -> Sign In/Up validation error + protected route redirect (`/library` -> `/auth?redirect=%2Flibrary`) + axe WCAG AA check.


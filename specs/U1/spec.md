# Unit U1 Specification — Foundation, Auth & Design System

- **Epic:** `#1` `[U1] Foundation, Auth & Design System`
- **Story:** `#2` (`US-001` — Host Registration & Email/Password Auth)
- **Milestone:** `R1 MVP` (`v0.1.0`)
- **Requirements:** `FR-080`, `FR-084`, `FR-085`, `NFR-003`, `NFR-004`, `NFR-005`, `NFR-006`, `NFR-007`, `NFR-008`

---

## 1. Scope & Behaviour

### 1.1 Project Toolchain & Quality Baseline
- Initialize a strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`), React 18, Vite SPA with React Router, Tailwind CSS, Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-select`, `@radix-ui/react-tooltip`, `@radix-ui/react-slot`), Zustand, TanStack Query, Framer Motion, `react-hook-form`, `zod`, and `lucide-react`.
- Configure ESLint, Prettier, Vitest (`@testing-library/react`, `jsdom`), and Playwright (`@playwright/test`, `@axe-core/playwright`).
- Ensure `shared/` is importable by both `src/` (browser bundle) and `api/` (Vercel Node functions).

### 1.2 Eroot Brand, Design System & Geometric Answer Primitives
- **Brand:** Original **Eroot** geometric emblem + wordmark SVG (`ErootLogo`), zero Kahoot branding, zero AI prompts/Generate buttons, zero Upgrade/paywall badges.
- **Surfaces:**
  - Light workspace palette for Creator/Library/Auth/Reports (`#f8fafc` background, `#ffffff` elevated cards, `#4f46e5` primary indigo focus/actions, `#7c3aed` purple validation callout accents).
  - Deep indigo/slate stage tokens (`#0f172a` to `#1e1b4b`) for Host big-screen surfaces (`HostStageShell`).
- **Geometric Answer Tiles (`AnswerTile` & `AnswerShapeIcon`):**
  - Index 0: Red (`#dc2626`, text `#ffffff`) + **Triangle** + Label `A`
  - Index 1: Blue (`#2563eb`, text `#ffffff`) + **Diamond** + Label `B`
  - Index 2: Yellow/Amber (`#eab308`, text `#0f172a` for >= 4.5:1 WCAG AA contrast) + **Circle** + Label `C`
  - Index 3: Green (`#16a34a`, text `#ffffff`) + **Square** + Label `D`
  - Index 4: Teal (`#0d9488`, text `#ffffff`) + **Hexagon** + Label `E`
  - Index 5: Purple (`#9333ea`, text `#ffffff`) + **Star** + Label `F`
  - Supports `prefers-reduced-motion` via Framer Motion `MotionConfig reducedMotion="user"`.

### 1.3 Internationalization (`i18n`) Scaffold
- Typed dictionary structure under `src/i18n/en.ts` + `useTranslation()` hook (`t('key')`).
- All U1 UI strings (navigation, auth forms, validation messages, health/error states, tile aria labels) live in `en.ts`.

### 1.4 Database Schema & Storage Migration (`supabase/migrations/0001_u1_core.sql`)
- Tables: `profiles`, `quizzes`, `slides`, `media_assets` with triggers (`set_updated_at`, `handle_new_user` auto-creating `profiles` on `auth.users` signup).
- Row Level Security enabled on all tables; policies scoped to `auth.uid()` owner and `visibility = 'public' AND is_published = true` read access on `quizzes`/`slides`.
- Storage bucket `quiz-media` created idempotently with public read access and authenticated user write restricted to `<auth.uid()>/...`.

### 1.5 Host Authentication & Route Protection (`/auth`)
- **Email + password only** in R1 (no Google OAuth button yet; added in U5/R2).
- Sign In / Sign Up tabs on `/auth` validated via Zod (`email` valid, `password >= 8` characters, optional `displayName` on sign-up).
- Protected route wrapper (`RequireAuth`) checks active Supabase Auth session:
  - Loading state: centered accessible spinner (`role="status"`, `aria-label="Checking session..."`).
  - Unauthenticated: redirects to `/auth?redirect=<currentPath>`.
  - Authenticated: renders protected shell with top navigation (`Library`, `Reports` placeholder, `Sign out`, Host email/name).
- Landing `/` offers two primary actions: **Join a Game** (`/join` preview route) and **Host / Sign In** (`/library` or `/auth`).

### 1.6 Operational Health Endpoint (`GET /api/health`)
- Validates presence of `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (or fallback public URL check) and executes a lightweight Postgres check (`select id from quizzes limit 1` or `profiles` head query).
- Returns `200 OK` `{ status: 'ok', service: 'eroot-api', database: 'connected', timestamp }` when healthy.
- Returns `503 Service Unavailable` `{ status: 'degraded', service: 'eroot-api', database: 'unconfigured' | 'error', timestamp }` when env vars are missing or DB fails, without leaking secrets or stack traces.

---

## 2. Edge Cases & Error States

| Scenario | Expected Behaviour |
|---|---|
| Missing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in client build | App renders an informative configuration banner instead of throwing uncaught runtime errors; public routes and design-system preview remain testable. |
| Auth signup requires email confirmation in Supabase settings | UI detects `session === null && user !== null` after `signUp` and displays a clear verification-email notice instead of navigating prematurely to `/library`. |
| Invalid credentials on Sign In | Inline `role="alert"` error message (`Invalid email or password`), focus remains manageable, submit button exits loading state. |
| Duplicate email on Sign Up | Friendly error banner without exposing internal Supabase raw codes beyond clear user guidance. |
| `/api/health` called without Supabase env configured | Clean `503` JSON response (`database: 'unconfigured'`) with `Cache-Control: no-store`. |
| User prefers reduced motion | Framer Motion animations resolve immediately without translate/scale motion. |

---

## 3. UI States Checklist

- **Empty state:** `/library` (U1 placeholder shell before U2/U7 full library) shows an empty state card ("No quizzes yet — Creator arrives in U2") and sign-out action.
- **Loading state:** Session hydration spinner; Auth submit button disabled with spinner & `aria-busy="true"`.
- **Error state:** Inline form field errors (`aria-invalid="true"`, `aria-describedby`) + top alert banner (`role="alert"`).


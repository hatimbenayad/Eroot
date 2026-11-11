# Eroot System Architecture

## 1. High-Level Topology

```
+----------------------------+       HTTPS / REST       +-----------------------------+
|  Browser SPA (React 18)    | -----------------------> |  Vercel Serverless (/api/*) |
|  - Creator (/creator/:id)  |                          |  - Authoritative game state |
|  - Host Stage (/host/:id)  |                          |  - Server timestamp scoring |
|  - Mobile Player (/join)   |                          |  - Rate limiting / anti-bot |
|  - Library & Reports       |                          |  - /api/health              |
+-------------+--------------+                          +--------------+--------------+
              |                                                        |
              | Supabase JS (Auth + Storage + Direct CRUD under RLS)   | Service Role Key
              | + Realtime Broadcast/Presence (1 channel/game)         | (Privileged RPC/SQL)
              v                                                        v
+-------------------------------------------------------------------------------------+
|                                  Supabase Platform                                  |
|  - Postgres 15+ with Row Level Security (RLS)                                       |
|  - Supabase Auth (Email+Password R1, Google OAuth R2)                               |
|  - Supabase Storage (`quiz-media` bucket for slide/cover/answer images)             |
|  - Supabase Realtime (Broadcast game events + throttled answer counts)              |
+-------------------------------------------------------------------------------------+
```

## 2. Architectural Principles

1. **Zero Persistent Sockets on Vercel:** All real-time fan-out uses Supabase Realtime Broadcast/Presence; all state mutations run in short-lived Vercel Serverless Functions (`api/**/*.ts`) or Postgres RPCs.
2. **Authoritative Server State & Anti-Cheat:**
   - Answer keys live strictly inside `game_snapshots` (RLS-locked to host & service role).
   - Player devices receive sanitized slide payloads (`public_slides`) omitting `isCorrect`, `acceptedAnswers`, `targetValue`, and `targetRegion` until the host transitions the game to `question_reveal`.
   - Response times and scores are computed strictly on the server using UTC server timestamps (`now()`).
3. **Shared Pure Domain Core (`shared/`):**
   - Pure TypeScript modules (`zod` slide schemas, answer sanitizers, scoring math, state machine transitions, profanity filter, i18n keys) sit under `shared/` and are imported directly by both `src/` (Vite frontend) and `api/` (Vercel Functions) so validation and scoring logic never drift.
4. **Original Assets & Accessibility:**
   - All themes, SVGs, geometric answer markers (red triangle, blue diamond, yellow circle, green square), and Web Audio synthesized soundscapes are 100% original to Eroot.
   - Colour is paired with distinct shapes and labels everywhere.
5. **Lightweight Privacy-First Observability:**
   - No Sentry, no third-party analytics scripts. Server logs are structured JSON via Vercel stdout; `/api/health` checks app + Postgres connectivity.

## 3. Repository Directory Structure

```
Eroot/
  api/                  Vercel Serverless Functions (/api/health, /api/games/*)
  docs/
    adr/                Architecture Decision Records
    design/             System design docs (this folder)
    inception/          Requirements, user stories, units, risks, backlog
  shared/               Pure TS schemas, scoring, state machine, i18n, moderation
  specs/                SDD per-unit specifications (U1..U10)
  src/
    app/                Router, providers, layout shells
    components/         Reusable UI primitives (Radix/shadcn + Eroot geometric tiles)
    features/           Domain slices: auth, creator, library, host, player, reports, discover
    i18n/               Typed translation dictionaries (en in R1, es in R3)
    lib/                Supabase client, API client, Web Audio synthesizer, utilities
    styles/             Tailwind & CSS design tokens
  supabase/
    migrations/         Versioned SQL migrations (tables, indexes, RLS, RPCs)
  tests/
    unit/               Vitest unit tests (shared + components)
    e2e/                Playwright end-to-end & axe accessibility tests
```


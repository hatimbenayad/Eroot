# Eroot

**Eroot** is an open, free, Kahoot-style live and self-paced interactive quiz platform built with **React 18, TypeScript, Tailwind CSS, Vite, Supabase, and Vercel Serverless Functions** following **AI-DLC + Spec-Driven Development (SDD)**.

Every feature in Eroot is free — no paywalls, no subscription tiers, no AI generation bloat, and no player accounts required. Players join from any phone browser with a Game PIN and nickname.

---

## Key Features

### Studio & Content Creator (`/creator/:quizId`, `/library`, `/discover`)
- **Three-pane visual editor:** Reorderable slide sidebar (`dnd-kit` drag-and-drop + keyboard controls + `!` validation badges), center slide canvas with geometric high-contrast tiles (`A` Red Triangle, `B` Blue Diamond, `C` Yellow Circle with dark ink, `D` Green Square, `E` Teal Hexagon, `F` Purple Star), and right-hand Question Properties + 8 original Themes.
- **Full question & slide library (free):**
  - *Scored knowledge:* **Quiz** (2–6 options, single or multi-select with proportional scoring & 0 points on wrong picks), **True or false**, **Type answer**, **Slider** (range + tolerance), **Puzzle** (4-step ordering), **Pin answer** (circle or polygon normalized target region).
  - *Opinion & collaborative:* **Poll**, **Scale**, **NPS scale**, **Drop pin** (spatial cluster heatmap), **Word cloud**, **Open-ended**, **Brainstorm** (two-phase submit + live upvoting).
  - *Media slides (7):* Classic, Big title, Title & text, Bullet points, Quote, Big media, Video (HTTPS YouTube/Vimeo embeds).
- **Library organization & discovery:** Folders, favourites, duplicate/share links, **5 starter templates**, **Find** public question bank search, and **Import** from `.csv` / `.xlsx` with downloadable template.
- **Autosave & preview:** Debounced draft autosave, media uploads (`quiz-media` bucket), gradual image blur reveal toggle, and live Host Preview modal.

### Live Host & Player Surfaces (`/host/:gameId`, `/join`, `/play/:gameId`)
- **Authoritative server engine:** Answer keys live exclusively inside RLS-locked `game_snapshots`; players receive sanitized `public_slides`. Response times and speed-weighted scores (`round((1 - responseTime / questionTime / 2) * maxPoints)`) calculate on Vercel Functions using server UTC timestamps. Streaks are visual-only (no bonus multipliers).
- **Classic PvP & Team Mode:** Configurable 2–5 coloured teams with automatic team balancing or player choice, team lobby columns, and mean per-question team scoring.
- **Moderation & resilience:** Configurable player cap (default `100`), profanity/leetspeak nickname filter (EN/ES), friendly nickname generator, player kick, optional player identifier field, QR join code, Web Audio synthesized lobby/gameplay soundscape, and seamless browser reload resume.

### Self-Paced Challenges & Reports (`/challenges`, `/challenge/:pin`, `/reports`)
- **Self-paced challenges ("Assign"):** Configurable deadline, per-slide countdown toggle, optional accuracy-only scoring (no speed penalty), and host participant management (`/challenges`).
- **Post-game analytics (`/reports/:id`):** Summary difficulty flags (`<35%` difficult questions), players needing help (`<50%`), unfinished participants, animated **Podium Replay**, **"Play again"**, practice quiz generation from `>= 3` difficult questions, and formula-safe **CSV / XLSX** export.

### Accessibility, Security & Internationalization
- **WCAG 2.1 AA:** Colour is always paired with distinct geometric shapes and letter/text labels, keyboard accessible controls, `prefers-reduced-motion` support, and automated `@axe-core/playwright` checks.
- **Bilingual UI (`en` / `es`):** Instant English/Spanish language switcher persisted in `localStorage`.
- **Hardened delivery:** Security headers in `vercel.json`, per-IP/user rate limits on PIN lookup/join/create/submit, and `React.lazy` route splitting.

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Zustand, TanStack Query, `dnd-kit`, Framer Motion, `react-hook-form`, Zod, `exceljs`, `qrcode.react`
- **Backend & Realtime:** Vercel Serverless Functions (`/api/*`, 10 routes total) + Supabase (Postgres 15 + RLS, Auth Email/Google OAuth, Storage, Realtime Broadcast)
- **Testing & Quality:** Vitest, Testing Library, Playwright + `@axe-core/playwright`, ESLint, Prettier

---

## Getting Started

### 1. Prerequisites
- Node.js `>= 20` and npm
- A Supabase project (run migrations under `supabase/migrations/0001_u1_core.sql` through `0004_u8_teams_challenges.sql` in order)

### 2. Environment Variables
Copy `.env.example` to `.env.local` (for Vite + local Vercel dev):

```bash
cp .env.example .env.local
```

Required variables:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase public anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Server-only key for Vercel `/api/*` functions (never expose to browser)

Optional storage/oauth setup in Supabase:
- Ensure public Storage bucket `quiz-media` exists with authenticated upload policies.
- Enable Email+Password and (optionally) Google OAuth in Supabase Auth Providers.

### 3. Install & Run Locally

```bash
npm install
npm run dev
```

For full-stack local testing including `/api/*` functions, run with Vercel CLI (`npx vercel dev`).

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite frontend dev server |
| `npm run build` | Type-check (`tsc -b`) and build optimized production bundle |
| `npm run typecheck` | Run strict TypeScript check (`tsc --noEmit`) |
| `npm run lint` | Run ESLint across workspace |
| `npm test` | Run Vitest unit & integration test suites |
| `npm run test:e2e` | Run Playwright E2E + `@axe-core/playwright` accessibility tests |
| `npm run load:sanity` | Run 100-player × 10-round server scoring/sanitization benchmark |

---

## Architecture & Documentation

- [System Architecture](docs/design/architecture.md)
- [Data Model & Migrations](docs/design/data-model.md)
- [API Contracts](docs/design/api.md)
- [UI Flows & Routes](docs/design/ui-flows.md)
- [Architecture Decision Records (`docs/adr/`)](docs/adr)
- [Specs per Unit (`specs/U1..U10`)](specs)
- [100-Player Load Sanity & Bundle Report](docs/load-test-results.md)
- [Project Retrospective](docs/retrospective.md)

---

## License

MIT — see [LICENSE](LICENSE).


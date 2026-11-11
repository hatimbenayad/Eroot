# Eroot AI-DLC Units of Work & Release Plan

Each unit is an independently deliverable vertical slice backed by an SDD specification (`specs/<unit>/spec.md`, `plan.md`, `tasks.md`, `acceptance-tests.md`) before coding begins.

## Milestone Map

| Milestone | Tag | Units Included | Deliverable Outcome |
|---|---|---|---|
| **R1 — MVP** | `v0.1.0` | `U1`, `U2`, `U3`, `U4` | End-to-end playable live quiz loop: host registers (email/password), builds valid quizzes with 4 core slide types, hosts a live game with PIN/QR, players join anonymously on mobile and score in real time through podium & report creation. |
| **R2 — Full Creator, Reports & Library** | `v0.2.0` | `U5`, `U6`, `U7` | Google OAuth, full R2 question/opinion/media slide suite, detailed Reports with `.xlsx`/`.csv` export and difficult-question quiz builder, My Library folders/favourites, Discover public catalog, 5 starter templates, Find bank & spreadsheet import. |
| **R3 — Teams, Challenges, Spatial & Polish** | `v1.0.0` | `U8`, `U9`, `U10` | Team mode (2–5 teams), Self-paced Challenges (Assign), Pin answer / Drop pin / Brainstorm, hardened moderation & rate limiting, Spanish (`es`) i18n, full accessibility/Lighthouse audit, and 100-player load sanity benchmark. |
| **Future** | — | Post-`v1.0.0` backlog | Themed game modes, host auto-play, real-time quiz collaborators, extra languages. |

---

## Unit Breakdown

### U1 — Foundation, Auth & Design System (`R1 MVP`)
- **Goal:** Establish buildable, deployable monorepo/app skeleton with strict TypeScript, Tailwind + Radix/shadcn design tokens (Eroot brand, light Creator palette, deep indigo/slate Host stage, geometric shape+colour answer tile primitives), typed `en` i18n scaffolding, Supabase schema v1 + RLS, email+password Host Auth, `/api/health`, Vitest/Playwright/axe test harness, and Vercel deployment pipeline.
- **Requirements:** `FR-080`, `FR-084`, `FR-085`, `NFR-003`, `NFR-004`, `NFR-005`, `NFR-006`, `NFR-007`, `NFR-008`.

### U2 — Creator Core (`R1 MVP`)
- **Goal:** Build the three-pane Quiz Creator (`Top bar`, `Slide list` with `dnd-kit` drag reordering, `Center canvas`, `Properties/Themes` inspector), inline purple validation tooltips + `!` badges, debounced draft autosave, Settings modal (title, description, visibility, cover image, music), image upload to Supabase Storage, ~8 original Eroot themes, and local Preview mode.
- **Requirements:** `FR-001` through `FR-011`.

### U3 — Question Types R1 (`R1 MVP`)
- **Goal:** Implement data schemas (Zod), Creator editors, Preview renderers, Host stage views, and Player tile UIs for the 4 MVP slide types: **Quiz** (2–6 options, >=1 correct), **True or false**, **Poll** (opinion, 0 pts), and **Classic** media slide.
- **Requirements:** `FR-012`, `FR-013`, `FR-014`, `FR-015`.

### U4 — Live Game Engine (`R1 MVP`)
- **Goal:** Implement authoritative Vercel Functions + Postgres transactional state & scoring (`lobby` -> `question_intro` -> `question_active` -> `question_reveal` -> `scoreboard` -> `podium` -> `ended`), immutable quiz snapshot on launch, 6–7 digit PIN + QR code, Game Options modal, anonymous `/join` flow with `localStorage` reconnect token, Realtime lobby + kick player, Web Audio lobby/timer music, server-timestamp scoring with visual-only streaks, Top-5 scoreboard, Top-3 animated podium + replay, basic profanity filter, rate limiting, and automatic report record generation.
- **Requirements:** `FR-030` through `FR-040`, `FR-082`, `FR-083`, `NFR-001`, `NFR-002`.

### U5 — Question Types R2 & Google OAuth (`R2`)
- **Goal:** Add Google OAuth host sign-in and implement R2 slide/question types + media capabilities: **Multi-select**, **Type answer**, **Slider**, **Puzzle**, **Scale**, **NPS scale**, **Word cloud**, **Open-ended**, **6 Media slides** (`Big title`, `Title and text`, `Bullet points`, `Quote`, `Big media`, `Video`), plus per-answer images and optional image-reveal effect.
- **Requirements:** `FR-010` (R2 extensions), `FR-016` through `FR-022`, `FR-081`.

### U6 — Reports & Export (`R2`)
- **Goal:** Build the authenticated Reports dashboard (search, filter, sort, rename, delete) and per-game Report detail views (`Summary` with <35% difficult questions, struggling/unfinished players; `Players` matrix with player identifier; `Questions` breakdown including word clouds/open responses; Podium replay; `Play again` & `Create difficult-questions quiz`; `.xlsx` + `.csv` export).
- **Requirements:** `FR-060` through `FR-065`.

### U7 — Library, Discover, Templates & Spreadsheet Import (`R2`)
- **Goal:** Build `My Library` (drafts, published, favourites, custom folders, duplicate/share/delete), `Discover` public quiz search (by title, tag, subject, language; host or copy), 5 starter templates, Creator `Find` question-bank tab, and Creator `Import` tab for `.xlsx`/`.csv` with downloadable template.
- **Requirements:** `FR-005` (R2 tabs), `FR-070` through `FR-073`.

### U8 — Team Mode & Self-Paced Challenges (`R3`)
- **Goal:** Add **Team mode** (2–5 coloured teams, average team question score, team podium) to live games and build **Self-paced Challenges ("Assign")** with shareable link + PIN, deadline management, timer toggle, accuracy-only mode, async player resume, and player removal.
- **Requirements:** `FR-041`, `FR-050`, `FR-051`, `FR-052`.

### U9 — Question Types R3: Spatial & Collaborative (`R3`)
- **Goal:** Implement **Pin answer** (image target circle/polygon validation), **Drop pin** (opinion coordinate cluster/heatmap), and **Brainstorm** (two-phase submit + upvote + ranked host view), wired across Creator, Host, Player, Challenges, and Reports.
- **Requirements:** `FR-023`, `FR-024`, `FR-025`.

### U10 — Safety, Accessibility, Spanish i18n, Performance & Ops (`R3`)
- **Goal:** Complete Spanish (`es`) translation & language switcher, harden nickname profanity/rate-limiting/security controls, run full WCAG AA + axe + reduced-motion accessibility pass, optimize `/join` mobile Lighthouse budget (>=90 perf / >=95 a11y), execute and document the ~100-player live load sanity test, and finalize `README.md`, `CONTRIBUTING.md`, and `docs/retrospective.md`.
- **Requirements:** `FR-082`, `FR-084`, `NFR-002`, `NFR-003`, `NFR-004`, `NFR-008`, `NFR-009`.

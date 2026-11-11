# Eroot GitHub Backlog Blueprint (Labels, Milestones, Epics, Stories & Tasks)

> Note: Per `0. ignore gh`, this document serves as the canonical issue registry inside the repository so every SDD task, commit reference (`#N`), and release tag (`v0.1.0`, `v0.2.0`, `v1.0.0`) remains traceable without requiring `gh` CLI locally. Issue templates reside in `.github/ISSUE_TEMPLATE/`.

---

## 1. Label Taxonomy

- **Type:** `type:epic`, `type:story`, `type:task`, `type:bug`, `type:docs`, `type:chore`
- **Priority:** `priority:p0`, `priority:p1`, `priority:p2`
- **Unit:** `unit:U1` .. `unit:U10`
- **Phase:** `phase:inception`, `phase:construction`, `phase:operations`
- **Area:** `area:creator`, `area:host`, `area:player`, `area:reports`, `area:infra`, `area:design`

---

## 2. Milestones

| Milestone | Target Tag | Units | Goal |
|---|---|---|---|
| **R1 MVP** | `v0.1.0` | `U1`–`U4` | Playable end-to-end live quiz loop (Creator + 4 R1 slide types + Host/Player live game + email/password auth) |
| **R2** | `v0.2.0` | `U5`–`U7` | Google OAuth, R2 question/opinion/media types, Reports & `.xlsx`/`.csv` export, Library, Discover, Templates, Find & Import |
| **R3** | `v1.0.0` | `U8`–`U10` | Team mode, Self-paced Challenges (Assign), Pin/Drop-pin/Brainstorm, Spanish i18n, hardening, accessibility, 100-player load test, Operations docs |
| **Future** | — | Backlog | Themed game modes (Robot Run, Treasure Trove, Color Kingdoms, Tallest Tower, Submarine Squad, Rocket Race), auto-play, real-time collaborators, additional languages |

---

## 3. Master Issue Index (`#1`–`#58`)

### Milestone: R1 MVP (`v0.1.0`)

#### Epic #1 — `[U1] Foundation, Auth & Design System` (`type:epic`, `unit:U1`, `priority:p0`) — **DONE**
- [x] **Story #2:** `As a host, I can register and sign in with email and password` (`US-001`, `unit:U1`, `area:infra`)
  - [x] **Task #3:** `chore(u1): scaffold Vite + React 18 + TS + Tailwind + Radix + ESLint/Prettier + Vitest/Playwright`
  - [x] **Task #4:** `feat(u1): implement Eroot design system tokens, geometric shape+colour tile primitives, and i18n dictionary scaffold (en)`
  - [x] **Task #5:** `feat(u1): add initial Supabase Postgres migrations, RLS policies, and Storage bucket setup`
  - [x] **Task #6:** `feat(u1): implement email/password Auth flow, protected route guards, and /api/health endpoint`
  - [x] **Task #7:** `chore(u1): configure Vercel deployment (vercel.json, .env.example) and CI lint/typecheck/unit checks`

#### Epic #8 — `[U2] Creator Core` (`type:epic`, `unit:U2`, `priority:p0`) — **DONE**
- [x] **Story #9:** `As a creator, I can build, reorder, theme, upload images, preview, and autosave quizzes` (`US-002`, `unit:U2`, `area:creator`)
- [x] **Story #10:** `As a creator, I see inline validation tooltips and cannot host/publish invalid quizzes` (`US-003`, `unit:U2`, `area:creator`)
  - [x] **Task #11:** `feat(u2): build three-pane Creator shell (top bar, slide list, canvas, inspector/themes + help modal)`
  - [x] **Task #12:** `feat(u2): implement quiz/slide CRUD, debounced draft autosave, and Settings dialog`
  - [x] **Task #13:** `feat(u2): add dnd-kit drag-and-drop and keyboard slide reordering plus duplicate/delete`
  - [x] **Task #14:** `feat(u2): add Zod inline slide validation, purple tooltip callouts, and invalid "!" badges`
  - [x] **Task #15:** `feat(u2): implement Supabase Storage question image upload, ~8 Eroot themes, and Creator Preview mode`

#### Epic #16 — `[U3] Question Types R1` (`type:epic`, `unit:U3`, `priority:p0`) — **DONE**
- [x] **Story #17:** `As a creator, I can author Quiz (2-6 options), True or False, Poll, and Classic slides` (`US-004`, `unit:U3`, `area:creator`)
  - [x] **Task #18:** `feat(u3): define shared Zod schemas & answer sanitizers for Quiz, True/False, Poll, and Classic`
  - [x] **Task #19:** `feat(u3): build Add-slide modal (Add tab groups) and type-switching logic preserving compatible fields`
  - [x] **Task #20:** `feat(u3): implement Quiz (up to 6 tiles, multi-correct), True/False, Poll, and Classic editors & preview renderers`

#### Epic #21 — `[U4] Live Game Engine` (`type:epic`, `unit:U4`, `priority:p0`) — **DONE**
- [x] **Story #22:** `As a host, I can launch a game with options, PIN/QR lobby, immutable snapshot, and kick control` (`US-005`, `unit:U4`, `area:host`)
- [x] **Story #23:** `As a host, I can run live questions, reveal distributions, Top-5 scoreboard, and podium replay` (`US-006`, `unit:U4`, `area:host`)
- [x] **Story #24:** `As a player, I can join anonymously on mobile via PIN + nickname without an account` (`US-012`, `unit:U4`, `area:player`)
- [x] **Story #25:** `As a player, I can answer via geometric tiles, see feedback/visual streaks, and reconnect` (`US-013`, `unit:U4`, `area:player`)
  - [x] **Task #26:** `feat(u4): build pure TypeScript scoring engine + game state machine with exhaustive Vitest unit tests`
  - [x] **Task #27:** `feat(u4): create live game Postgres schema/RPCs (games, players, answers, quiz_snapshot, report stub) & rate limiting`
  - [x] **Task #28:** `feat(u4): implement Vercel Functions (/api/games/create, lookup, join, session, state, answer, kick) with server timestamps`
  - [x] **Task #29:** `feat(u4): build Host Game Options modal, Lobby (PIN, QR, player roster, kick, Web Audio music) & Question/Reveal/Scoreboard/Podium screens`
  - [x] **Task #30:** `feat(u4): build mobile-first Player screens (/join, /play/:id, geometric answer tiles, feedback, visual streak, localStorage reconnect)`
  - [x] **Task #31:** `test(u4): add Playwright E2E full live game test (host + 2 players) and mobile viewport verification`

---

### Milestone: R2 (`v0.2.0`)

#### Epic #32 — `[U5] Question Types R2 & Google OAuth` (`type:epic`, `unit:U5`, `priority:p1`) — **DONE**
- [x] **Story #33:** `As a host, I can sign in with Google and use all R2 question, opinion, and media slide types` (`US-007`, `unit:U5`, `area:creator`)
  - [x] **Task #34:** `feat(u5): integrate Google OAuth provider in Supabase Auth and /auth UI`
  - [x] **Task #35:** `feat(u5): implement Multi-select Quiz mode (proportional score, 0 on any wrong pick)`
  - [x] **Task #36:** `feat(u5): implement Type answer, Slider, and Puzzle schemas, editors, host & player UIs, and server scoring`
  - [x] **Task #37:** `feat(u5): implement Scale, NPS scale, Word cloud, and Open-ended opinion types & live host visualizations`
  - [x] **Task #38:** `feat(u5): implement 6 R2 Media slides (Big title, Title+text, Bullets, Quote, Big media, Video) + per-answer images + image reveal`

#### Epic #39 — `[U6] Reports & Export` (`type:epic`, `unit:U6`, `priority:p1`) — **DONE**
- [x] **Story #40:** `As a host, I can browse reports, inspect players/questions, export xlsx/csv, and clone difficult questions` (`US-008`, `unit:U6`, `area:reports`)
  - [x] **Task #41:** `feat(u6): build Reports list page (search, filter by mode/date, sort, rename, delete)`
  - [x] **Task #42:** `feat(u6): build Report Summary, Players, Questions tabs (<35% difficult, needs-help, unfinished, podium replay)`
  - [x] **Task #43:** `feat(u6): implement .xlsx and .csv report export with formula-injection escaping`
  - [x] **Task #44:** `feat(u6): implement Play Again and non-AI difficult-questions (>=3) quiz generator`

#### Epic #45 — `[U7] Library, Discover, Templates & Import` (`type:epic`, `unit:U7`, `priority:p1`) — **DONE**
- [x] **Story #46:** `As a creator, I can organize Library folders, discover/clone quizzes, use 5 templates, Find questions, and import spreadsheets` (`US-009`, `unit:U7`, `area:creator`)
  - [x] **Task #47:** `feat(u7): build My Library (drafts, published, favourites, folders, duplicate, visibility/share)`
  - [x] **Task #48:** `feat(u7): build Discover page (search/filter public quizzes, host or copy to library) and 5 starter templates`
  - [x] **Task #49:** `feat(u7): build Creator Find tab (question bank search) and Import tab (.xlsx/.csv parser + downloadable template)`

---

### Milestone: R3 (`v1.0.0`)

#### Epic #50 — `[U8] Team Mode & Self-Paced Challenges` (`type:epic`, `unit:U8`, `priority:p1`) — **DONE**
- [x] **Story #51:** `As a host, I can run live Team Mode (2-5 teams) and Assign self-paced challenges` (`US-010`, `unit:U8`, `area:host`)
  - [x] **Task #52:** `feat(u8): implement Team Mode (2-5 teams, player assignment, mean team question scoring, team scoreboard/podium)`
  - [x] **Task #53:** `feat(u8): implement Self-paced Challenges (Assign modal, deadline/timer/accuracy-only, /challenge/:pin async flow, host management)`

#### Epic #54 — `[U9] Spatial & Collaborative Types` (`type:epic`, `unit:U9`, `priority:p2`)
- **Story #55:** `As a host and player, I can run Pin answer, Drop pin, and two-phase Brainstorm slides` (`US-011`, `unit:U9`, `area:creator`)
  - **Task #56:** `feat(u9): implement Pin answer (normalized region target editor, tap submission, server geometry check)`
  - **Task #57:** `feat(u9): implement Drop pin (opinion heatmap/cluster) and Brainstorm (submit + upvote two-phase flow)`

#### Epic #58 — `[U10] Safety, Accessibility, Spanish i18n, Performance & Ops` (`type:epic`, `unit:U10`, `priority:p0`)
- **Story #59:** `As a user and operator, Eroot passes rate-limiting, WCAG AA, Spanish i18n, Lighthouse mobile budgets, and 100-player load testing` (`US-014`, `unit:U10`, `area:infra`)
  - **Task #60:** `feat(u10): complete Spanish (es) translation dictionary and language switcher`
  - **Task #61:** `feat(u10): harden profanity moderation, PIN brute-force protection, and API rate limiting`
  - **Task #62:** `test(u10): run Playwright axe accessibility pass, reduced-motion verification, and Lighthouse /join mobile optimization`
  - **Task #63:** `docs(u10): run ~100-player load sanity test, record results, and write README.md, CONTRIBUTING.md, and docs/retrospective.md`

---

### Milestone: Future (Post-`v1.0.0`)

- **Future #64:** `[Future] Themed arcade game modes (Robot Run, Treasure Trove, Color Kingdoms, Tallest Tower, Submarine Squad, Rocket Race)` (`priority:p2`)
- **Future #65:** `[Future] Auto-play host pacing mode` (`priority:p2`)
- **Future #66:** `[Future] Real-time quiz collaborators via email invite` (`priority:p2`)
- **Future #67:** `[Future] Additional UI languages (French, Arabic)` (`priority:p2`)


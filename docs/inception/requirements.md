# Eroot Requirements Specification (Inception)

- **Product:** Eroot — Live & Self-Paced Game-Based Quiz Platform
- **Methodology:** AI-DLC + SDD
- **Releases:** `R1 (MVP)`, `R2`, `R3`, plus `Future` (out-of-scope deferred ideas)

---

## 1. Functional Requirements

### 1.1 Creator & Quiz Authoring

| ID | Release | Requirement |
|---|---|---|
| FR-001 | R1 | Hosts can create, read, update, duplicate, and delete quizzes with title, description, visibility (`private`, `link`, `public`), cover image, language, and lobby/game music preset. |
| FR-002 | R1 | The Creator exposes a three-pane layout: top bar (Eroot mark, editable title, Settings button, autosave status, Preview button, Exit, Save), left slide list, center editing canvas, and right Properties/Themes inspector + Help modal. |
| FR-003 | R1 | The left slide list renders numbered slides with type label, question snippet thumbnail, time-limit badge, media/answer indicators, blue active border, hover duplicate/delete controls, purple `!` validation badge when incomplete, and a `+ Add` button. |
| FR-004 | R1 | Hosts can reorder slides in the left sidebar via drag-and-drop (`dnd-kit`) and accessible keyboard controls. |
| FR-005 | R1 | Clicking `+ Add` opens a tabbed picker (`Add` in R1; `Find` and `Import` added in R2; no AI `Generate` tab) grouping types into *Test knowledge*, *Collect opinions*, and *Media slides*. |
| FR-006 | R1 | Real-time inline validation renders purple tooltips on invalid fields (e.g., missing question text, missing required answers, no correct answer chosen on scored types) and prevents publishing or hosting until all slides are valid. |
| FR-007 | R1 | Creator changes autosave to drafts with live status (`Saving...`, `Saved to: Your drafts`, or retry state on error). |
| FR-008 | R1 | The Question Properties panel supports switching slide type (preserving compatible text/media), changing time limit (`5, 10, 20, 30, 60, 90, 120, 240` s) with `Apply to all questions`, answer select mode (`Single select` in R1; `Multi-select` in R2), points mode (`Standard 1000`, `Double 2000`, `No points 0`), Duplicate, and Delete. |
| FR-009 | R1 | The Themes tab provides ~8 original Eroot background themes applied consistently across Creator preview, Host stage, and Player screens. |
| FR-010 | R1/R2 | Hosts can upload question images via file picker or drag-and-drop to Supabase Storage (R1), attach per-answer images (R2), toggle optional image-reveal effect (R2), and embed YouTube video URLs (R2). |
| FR-011 | R1 | Hosts can preview a quiz inside the Creator as a simulated host + answer preview without creating a live game or report. |

### 1.2 Slide & Question Types

| ID | Release | Slide / Question Type & Behaviour |
|---|---|---|
| FR-012 | R1 | **Quiz:** 2–6 answer tiles (2x2 default with `Add more answers` up to 6), >= 1 correct answer, geometric shape + colour per tile. |
| FR-013 | R1 | **True or false:** 2 fixed options (`True`, `False`), 1 correct option, scored using standard formula. |
| FR-014 | R1 | **Poll:** 2–4 options, no correct answer, 0 points, displays live response distribution bars. |
| FR-015 | R1 | **Classic media slide:** Non-scored informational slide with title/heading, body text, optional image, 0 points. |
| FR-016 | R2 | **Multi-select (Quiz option):** Players select multiple options and click Submit; proportional score for correct selections, `0` if any wrong option is chosen. |
| FR-017 | R2 | **Type answer:** Player submits a short text response (<= 20 chars); host defines accepted answers evaluated case-insensitively and trimmed. |
| FR-018 | R2 | **Slider:** Player picks a numeric value on a configured range (`min`, `max`, `step`); host sets target value and tolerance margin. |
| FR-019 | R2 | **Puzzle:** Player orders 4 items into the exact target sequence. |
| FR-020 | R2 | **Scale & NPS scale:** Opinion rating scales (e.g., `1–5` with endpoint labels; `0–10` NPS computing %Promoters - %Detractors), 0 points, distribution display. |
| FR-021 | R2 | **Word cloud & Open-ended:** Word cloud aggregates short phrases into a weighted live visualization; Open-ended collects free text up to 250 chars displayed as moderated response cards; 0 points. |
| FR-022 | R2 | **Additional Media slides (6):** `Big title`, `Title and text`, `Bullet points`, `Quote`, `Big media`, and `Video` (YouTube/URL embed); 0 points. |
| FR-023 | R3 | **Pin answer:** Player drops a pin on an uploaded image; host defines a valid circle or polygon target region; scored within region. |
| FR-024 | R3 | **Drop pin:** Opinion image-pin question displaying an aggregated pin cluster / heatmap on the host screen; 0 points. |
| FR-025 | R3 | **Brainstorm:** Two-step collaborative opinion slide — players submit ideas, then upvote submitted ideas, showing ranked results on the host stage; 0 points. |

### 1.3 Live Game Engine (Host & Player)

| ID | Release | Requirement |
|---|---|---|
| FR-030 | R1 | Launching a live game opens Game Options: mode (`Classic PvP` in R1; `Team mode` in R3), randomize question order, randomize answer order, show question on player devices, optional player identifier prompt, friendly nicknames toggle, and music/volume controls. |
| FR-031 | R1 | Starting a lobby generates a unique 6–7 digit Game PIN, join URL, and QR code, and saves an **immutable quiz snapshot** on the `games` record. |
| FR-032 | R1 | Anonymous players join at `/join` by entering PIN, optional player identifier (if enabled), and nickname (or random/friendly nickname generator) without creating an account. |
| FR-033 | R1 | Host lobby displays live connected player count and nicknames via Supabase Realtime, lets the host kick any player by clicking their nickname, and enables Start when >= 1 player is present. |
| FR-034 | R1 | Authoritative state machine (`lobby` -> `question_intro` -> `question_active` -> `question_reveal` -> `scoreboard` -> `podium` -> `ended`) advances only via host API calls to Vercel Functions. |
| FR-035 | R1 | Question screen displays server-synchronized countdown timer and live answer counter; player devices render geometric answer tiles (and question text/media when toggled on); host can skip, end question early, or press `Space` to advance. |
| FR-036 | R1 | Authoritative server scoring computes `points = round((1 - (responseTime / questionTime) / 2) * maxPoints)` using server timestamps (`maxPoints` = 1000 / 2000 / 0), `0` for wrong/unanswered, and never leaks answer keys to players prior to reveal. |
| FR-037 | R1 | Post-question reveal renders correct answer(s) and an option distribution chart on the host stage, and shows personal correctness, points earned, current rank, and **visual-only streak indicator** (no bonus points) on each player's device. |
| FR-038 | R1 | Top-5 Scoreboard renders between questions on the host stage; Final Podium animates Top 3 winners, shows each player's final rank, and supports host `Replay podium`. |
| FR-039 | R1 | Players who refresh or temporarily disconnect reconnect seamlessly to the live game with their nickname and accumulated score via a `localStorage` session token. |
| FR-040 | R1 | Ending a live game automatically persists a finalized game report record. |
| FR-041 | R3 | **Team mode:** Hosts configure 2–5 named, coloured teams; players join/are assigned teams on their own devices; each question's team score is the average of its members' scores (optional shared-device mode as stretch). |

### 1.4 Self-Paced Challenges ("Assign")

| ID | Release | Requirement |
|---|---|---|
| FR-050 | R3 | Hosts can assign any valid quiz as a self-paced challenge with a deadline, optional per-question timer toggle, and optional "accuracy only" (no speed bonus) mode, generating a shareable URL and PIN. |
| FR-051 | R3 | Players complete self-paced challenges asynchronously on any device before the deadline with persistent resume state. |
| FR-052 | R3 | Hosts can edit a challenge's deadline, end the challenge early, or remove individual players/submissions. |

### 1.5 Reports & Analytics

| ID | Release | Requirement |
|---|---|---|
| FR-060 | R2 | Reports list supports searching by quiz title, filtering by mode (`live` / `challenge`) and date, sorting, renaming reports, and deleting reports. |
| FR-061 | R2 | Report Summary view shows total players, question count, average accuracy, average response time, **difficult questions** (`< 35%` correct), **players needing help**, and **players who did not finish**. |
| FR-062 | R2 | Report Players view displays rank, total score, accuracy %, per-question answer breakdown, nickname, and optional player identifier. |
| FR-063 | R2 | Report Questions view displays per-question accuracy %, average response time, answer distribution chart, and open-text / word-cloud / brainstorm responses. |
| FR-064 | R2 | Reports support Final Podium replay, `Play again` (re-host quiz), and `Practice difficult questions` (non-AI generation of a new quiz copying difficult questions when >= 3 exist). |
| FR-065 | R2 | Hosts can export any report as `.xlsx` (multi-sheet workbook) and `.csv`. |

### 1.6 Library, Discover, Templates & Import

| ID | Release | Requirement |
|---|---|---|
| FR-070 | R2 | My Library organizes quizzes into drafts, published, favourites, and folders, with duplicate, delete, and visibility/share actions. |
| FR-071 | R2 | Discover page lets users search public quizzes by title, tag, subject, or language and either host immediately or clone to My Library. |
| FR-072 | R2 | Platform provides 5 built-in starter templates (e.g., *Icebreaker*, *Pub Quiz*, *Class Review*, *Team Check-in*, *Quick Trivia*). |
| FR-073 | R2 | Creator `Import` tab imports questions from `.xlsx` / `.csv` using a downloadable spreadsheet template; `Find` tab searches public quizzes/question bank to insert existing questions. |

### 1.7 Auth, Moderation, i18n & Operations

| ID | Release | Requirement |
|---|---|---|
| FR-080 | R1 | Hosts register and sign in using Supabase Auth email + password; Creator, Library, and Reports routes require host authentication. |
| FR-081 | R2 | Hosts can also sign in using Google OAuth via Supabase Auth. |
| FR-082 | R1/R3 | Player nicknames pass profanity filtering on join (baseline blocklist in R1, hardened configurable moderation in R3) plus optional host-enforced Friendly Nicknames mode. |
| FR-083 | R1 | Max players per live game is configurable per game/environment with default **100**. |
| FR-084 | R1/R3 | UI copy is externalized into typed i18n dictionaries from R1 (`en` default); full Spanish (`es`) translation and language selector ship in R3. |
| FR-085 | R1 | `GET /api/health` reports service and Postgres connectivity status cleanly without exposing credentials. |

---

## 2. Non-Functional Requirements

| ID | Release | Requirement |
|---|---|---|
| NFR-001 | R1 | **Server Authority:** Correct answers never reach player devices before `question_reveal`; all scoring and state transitions run in Vercel Functions / Postgres with server UTC timestamps. |
| NFR-002 | R1 | **Abuse & Rate Limiting:** Join, PIN lookup, and answer submission endpoints enforce rate limiting and PIN brute-force protection. |
| NFR-003 | R1 | **Accessibility:** Full keyboard navigation, visible focus states, WCAG AA contrast (`>= 4.5:1` for text), shape + colour + label redundancy on all answer options, `prefers-reduced-motion` support, and automated `axe` verification. |
| NFR-004 | R1 | **Responsive Performance:** Mobile-first player experience (`360px`+) targeting Lighthouse Performance >= 90 and Accessibility >= 95 on `/join`; desktop/projector-first host stage (`1024px`+). |
| NFR-005 | R1 | **No AI & No Paywall:** Zero AI generation tabs/buttons and zero premium gating, upgrade banners, star badges, or payment flows. |
| NFR-006 | R1 | **Original Brand & Audio:** Original Eroot branding, deep indigo/slate host stage, clean light creator UI, zero Kahoot assets, and original synthesized Web Audio API sound effects/music. |
| NFR-007 | R1 | **Code Quality & Tests:** Strict TypeScript, ESLint, Prettier, Vitest unit tests (scoring, Zod validation, state machine), and Playwright E2E tests (host + 2 players full loop). |
| NFR-008 | R1/R3 | **Lightweight Observability & Privacy:** Structured Vercel Function logs + `/api/health`; zero Sentry and zero third-party analytics trackers; secrets managed strictly via environment variables (`.env.example`). |
| NFR-009 | R3 | **Capacity & Load Sanity:** Verified behaviour with ~100 simulated concurrent players in a single live game documented under `docs/`. |

---

## 3. Out of Scope (Explicitly Excluded / Future)

- **Excluded permanently per project rules:** AI question/image generation (`Generate` tab, sparkle `Create` button), paid plans/Upgrade banners/subscriptions, PowerPoint/Teams/Google Slides integrations, slide-deck import, courses, Kids/Family profiles, flashcards/study groups, language-learning app, paid content marketplace.
- **Deferred to `Future` milestone:** Themed arcade game modes (Robot Run, Treasure Trove, Color Kingdoms, Tallest Tower, Submarine Squad, Rocket Race), auto-play host mode, real-time multi-host collaborators, additional locales beyond English & Spanish.


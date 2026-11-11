# Unit U4 Specification — Live Game Engine

- **Epic:** `#21` `[U4] Live Game Engine`
- **Stories:** `#22` (`US-005`), `#23` (`US-006`), `#24` (`US-012`), `#25` (`US-013`)
- **Milestone:** `R1 MVP` (`v0.1.0`)
- **Requirements:** `FR-030`–`FR-040`, `FR-082`, `FR-083`, `NFR-001`, `NFR-002`, `NFR-003`, `NFR-004`, `NFR-006`

---

## 1. Scope & Behaviour

### 1.1 Pure Scoring Engine & State Machine (`#26`)
- **Scoring (`shared/scoring/scoring.ts`):**
  - `getMaxPoints(pointsMode)`: `'standard' -> 1000`, `'double' -> 2000`, `'none' -> 0`.
  - `calculateSpeedPoints({ isCorrect, pointsMode, responseMs, questionMs })`:
    - Wrong or unanswered or `'none'` = `0` (no negative scores).
    - Correct = `Math.round((1 - (clamp(responseMs, 0, questionMs) / questionMs) / 2) * maxPoints)`.
  - `evaluateSlideAnswer(slide, payload, timing)`:
    - `quiz` / `true_false`: checks submitted `optionId` against authoritative `slide.content.options` (`isCorrect === true`).
    - `poll`: validates `optionId` exists, returns `{ isCorrect: null, points: 0 }`.
    - `classic`: returns `{ isCorrect: null, points: 0 }`.
  - **Streaks:** Consecutive correct answers increment `streak` (`0` on wrong or unanswered); **visual indicator only, zero bonus points** (`ADR-0002`).
- **State Machine (`shared/state-machine/game-state.ts`):**
  - States: `lobby` -> `question_intro` -> `question_active` -> `question_reveal` -> `scoreboard` -> ... -> `podium` -> `ended`.
  - Classic slides skip `scoreboard` (advance directly to next `question_intro` or `podium`).
  - Final slide `question_reveal` routes via `scoreboard` (if scored) or directly to `podium`, and `end` terminates cleanly from any active state.

### 1.2 Postgres Schema, RLS & Rate Limiting (`#27`)
- Migration `supabase/migrations/0002_u4_live_games.sql`:
  - `games`: holds `pin` (7-digit unique), `host_id`, `quiz_id`, `mode`, `state`, `current_slide_index`, `question_started_at`, `settings`, `theme_id`, `quiz_title`, `max_players` (default `100`), `public_slides` (sanitized only), `reveal_payload`, timestamps.
  - `game_snapshots`: stores `authoritative_slides` (with answer keys), RLS-locked to `host_id = auth.uid()` and service role only (**zero `anon` access**).
  - `players`: `id`, `game_id`, `nickname`, `identifier`, `session_token`, `total_score`, `streak`, `is_kicked`, `joined_at`, `last_seen_at`, partial unique index on `(game_id, lower(nickname))` where `is_kicked = false`.
  - `answers`: `id`, `game_id`, `player_id`, `slide_id`, `payload`, `response_ms`, `points`, `is_correct`, `submitted_at`, unique `(game_id, player_id, slide_id)`.
  - `reports`: `id`, `game_id` (unique), `host_id`, `title`, `mode`, `summary_cache`, `created_at`.
  - `rate_limits` + `check_rate_limit(bucket_key, max_hits, window_seconds)` Postgres function for distributed Serverless rate limiting.

### 1.3 Vercel Serverless Endpoints (`#28`)
All under `api/games/`:
- `POST /api/games/create` (Host Bearer JWT): validates quiz ownership and `validateQuiz()`, builds randomized/ordered immutable snapshot, strips answers into `public_slides`, generates unique 7-digit PIN, returns `{ gameId, pin, game }`.
- `POST /api/games/join` (Public, rate-limited): validates PIN, checks `state !== 'ended'` and player count `< max_players`, enforces profanity filter (`shared/moderation/nickname.ts`) or generates friendly nickname when configured, inserts player with opaque `session_token`, broadcasts `lobby_roster` on `game:<id>`, returns `{ gameId, playerId, sessionToken, nickname, game }`.
- `GET /api/games/session` (Player `x-player-token` or Host Bearer JWT): loads current sanitized state + player's personal rank/score/streak + current reveal feedback if in `question_reveal` / `scoreboard` / `podium`.
- `POST /api/games/state` (Host Bearer JWT): executes state transition (`start`, `begin_question`, `reveal`, `next`, `end`), stamps server `question_started_at`, computes option distribution + Top-5 scoreboard + Top-3 podium + `reports` record on `ended`, broadcasts `game_state` on `game:<id>`.
- `POST /api/games/answer` (Player `x-player-token`, rate-limited): verifies `question_active` (with 500 ms HTTP grace window), evaluates answer against `game_snapshots` using server timestamp `responseMs`, persists `answers` + updates `players.total_score` & `streak`, broadcasts throttled `answer_count`, returns `{ accepted: true, slideId }` **without** leaking `isCorrect` or `points` prior to reveal.
- `POST /api/games/kick` (Host Bearer JWT): sets `players.is_kicked = true`, broadcasts `player_kicked` + updated roster.

### 1.4 Host Live Stage & Game Options (`#29`)
- `GameOptionsModal`: launchable from Library `Host live` and Creator `Host`, configuring `randomizeQuestions`, `randomizeAnswers`, `showQuestionOnDevices`, `requirePlayerIdentifier` (+ prompt label), `friendlyNicknames`, `musicEnabled`, `musicVolume`, `maxPlayers` (default 100).
- `HostGamePage` (`/host/:gameId`, protected) using deep indigo/slate stage + quiz theme:
  - Lobby with large 7-digit PIN, join link copy button, QR code (`qrcode.react`), live joined player roster & count, kick player button, Web Audio music controls, and Start button.
  - Question Intro -> Question Active (countdown timer, answer count, `End question early`, `Skip` on classic slides, `Space` keyboard shortcut) -> Question Reveal (correct badge + distribution bar chart) -> Top-5 Scoreboard -> Animated Top-3 Final Podium (`Replay podium` button + `End & View Reports`).

### 1.5 Mobile-First Player Flow (`/join` & `/play/:gameId`) (`#30`)
- `/join`: PIN input (reads `?pin=`), lookup step checking whether `requirePlayerIdentifier` and `friendlyNicknames` are active (`GET /api/games/join?pin=...` or `POST /api/games/lookup`? Let's use `GET /api/games/lookup?pin=...` rate-limited returning `{ requiresIdentifier, identifierLabel, friendlyNicknames, quizTitle }` cleanly without leaking anything else!), optional identifier field, nickname input + Random Nickname button, saves `{ gameId, playerId, sessionToken, nickname }` in `localStorage`.
- `/play/:gameId`: subscribes to Realtime channel `game:<gameId>`, reconciles via `/api/games/session` on mount/reconnect, renders mobile-first geometric `AnswerTile` grid (`A..F`), confirmation screen after answering, personal feedback screen (correct/incorrect, `+points`, rank, visual-only streak counter) on reveal, final rank on podium, and kicked screen if removed by host.

---

## 2. Edge Cases & Error States

| Scenario | Behaviour |
|---|---|
| Player refreshes tab during `question_active` or `scoreboard` | `localStorage` session token resumes `/play/:gameId` at current phase with existing score, streak, and `alreadyAnswered` state intact. |
| Kicked player attempts to reconnect or join with kicked token | `/api/games/session` & `/api/games/answer` return `403 PLAYER_KICKED`; UI shows kicked message and clears token. |
| Player submits answer twice for same slide | Unique DB constraint + server check returns `409 ALREADY_ANSWERED`; score does not double-count. |
| Rate limit exceeded on `/api/games/lookup` or `/api/games/join` | Returns `429 RATE_LIMITED` with retry hint; protects against PIN brute forcing. |
| Game reaches `max_players` (default 100) | Join returns `409 GAME_FULL` with user-friendly message. |
| Host edits quiz in another tab during live game | Live game and report read solely from `game_snapshots` & `games.public_slides`; active game is unaffected. |


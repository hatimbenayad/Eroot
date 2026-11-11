# Eroot API Contracts (Vercel Serverless Functions)

All privileged game operations and operational checks live under `/api/*`. JSON payloads are validated with Zod; errors return a consistent envelope:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human-readable message"
  }
}
```

## 1. U1 Endpoints

### `GET /api/health`
- **Auth:** Public (no secrets exposed).
- **Purpose:** Readiness and uptime verification for Vercel and operators.
- **Response `200 OK`:**
  ```json
  {
    "status": "ok",
    "service": "eroot-api",
    "timestamp": "2026-11-11T16:30:00.000Z",
    "database": "connected"
  }
  ```
- **Response `503 Service Unavailable`** (when Postgres is unreachable or env config missing in strict check):
  ```json
  {
    "status": "degraded",
    "service": "eroot-api",
    "timestamp": "2026-11-11T16:30:00.000Z",
    "database": "unconfigured"
  }
  ```

## 2. Implemented Endpoints by Unit (10 Serverless Functions Total — Hobby Limit `<= 12`)

- **Live Game Engine (U4, U5, U8 Team Mode, U9 Spatial & Brainstorm):**
  - `POST /api/games/create` (Host JWT, rate-limited) — validates quiz, freezes `game_snapshots` & `public_slides`, creates `teams` rows when `mode === 'team'`, generates 7-digit PIN.
  - `GET /api/games/lookup?pin=...` (Public, rate-limited) — validates PIN and returns join prompt metadata (`mode`, `quizTitle`, `requirePlayerIdentifier`, `friendlyNicknames`, `teams`, `challengeDeadline`).
  - `POST /api/games/join` (Public, rate-limited) — validates PIN, enforces `max_players` (`100` default), runs hardened EN/ES nickname profanity filter or friendly generator, assigns selected or smallest balanced team, returns `playerId`, `sessionToken`, `gameId`, and current sanitized state.
  - `GET /api/games/session` (Player `sessionToken` or Host JWT) — resumes player/host state on reload including team standings & podiums.
  - `POST /api/games/state` (Host JWT) — transitions game state (`lobby -> question_intro -> question_active -> question_reveal -> scoreboard -> podium -> ended`), stamps server `question_started_at`, computes reveal payloads (`pinTarget`, `pinDrops`, `brainstormIdeas`, NPS, scale mean, word cloud), broadcasts sanitized payload on Supabase Realtime, writes report on `ended`.
  - `POST /api/games/answer` (Player `sessionToken`, rate-limited) — validates active window (`question_active`, plus `question_reveal` Brainstorm upvoting via `brainstormAction: 'vote_idea'`), computes `response_ms` & authoritative score via `shared/scoring`, persists `answers`, updates player scores & visual streak.
  - `POST /api/games/kick` (Host JWT) — marks `players.is_kicked = true` and broadcasts kick event.
- **Reports (U6):**
  - Report views query RLS-protected `reports`, `games`, `players`, `answers`, and `teams` directly via Host JWT; **CSV / XLSX** exports generate formula-safe (`escapeSpreadsheetCell`) files client-side with lazy-loaded `exceljs`.
- **Self-Paced Challenges (U8):**
  - `GET / POST / PATCH /api/challenges` (Host JWT, rate-limited) — list host challenges, create assigned challenge (`deadline`, `timerEnabled`, `accuracyOnly`), edit deadline, end early, or remove player.
  - `GET / POST /api/challenges/play` (Public / Player `sessionToken`, rate-limited) — fetch async challenge slides, join, or submit per-slide self-paced answers (including `accuracyOnly` and `pin` coordinates).


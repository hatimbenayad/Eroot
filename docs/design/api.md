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

## 2. Planned Endpoints by Unit (Specified in Detail per Unit Spec)

- **U4 (Live Game Engine):**
  - `POST /api/games/create` (Host JWT) — validates quiz, freezes `game_snapshots` & `public_slides`, generates 7-digit PIN.
  - `POST /api/games/join` (Public, rate-limited) — validates PIN, checks `max_players` (`100` default), runs nickname profanity filter or friendly generator, returns `playerId`, `sessionToken`, `gameId`, and current sanitized game state.
  - `GET /api/games/session` (Player `sessionToken` or Host JWT) — resumes player/host state on browser reload.
  - `POST /api/games/state` (Host JWT) — transitions game state (`lobby -> question_intro -> question_active -> question_reveal -> scoreboard -> podium -> ended`), stamps server `question_started_at`, broadcasts sanitized payload on Supabase Realtime, writes report on `ended`.
  - `POST /api/games/answer` (Player `sessionToken`, rate-limited) — validates active question window, computes `response_ms` & authoritative score via `shared/scoring`, persists `answers`, updates `players.total_score` & visual `streak`.
  - `POST /api/games/kick` (Host JWT) — marks `players.is_kicked = true` and broadcasts kick event.
- **U6 (Reports):**
  - `GET /api/reports/:id/export?format=xlsx|csv` (Host JWT) — generates sanitized workbook/CSV download.
- **U8 (Self-Paced Challenges):**
  - `POST /api/challenges/create`, `POST /api/challenges/submit`, `PATCH /api/challenges/:id` (deadline/close/remove player).

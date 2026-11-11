# Unit U4 Implementation Plan

1. **Install `qrcode.react`** for Host Lobby QR codes.
2. **Pure Shared Core (`#26`):**
   - `shared/scoring/scoring.ts` + `tests/unit/scoring.test.ts`
   - `shared/state-machine/game-state.ts` + `tests/unit/game-state.test.ts`
   - `shared/moderation/nickname.ts` + `tests/unit/nickname.test.ts`
3. **Database Migration (`#27`):**
   - `supabase/migrations/0002_u4_live_games.sql` defining `games`, `game_snapshots`, `players`, `answers`, `reports`, `rate_limits`, `check_rate_limit(...)`, and strict RLS policies.
4. **Vercel Serverless Functions (`#28`):**
   - `api/_lib/supabase-admin.ts` (service-role client, JWT verification, rate-limit helper, Realtime `httpSend` broadcast wrapper, error helper).
   - `api/games/create.ts`, `api/games/lookup.ts`, `api/games/join.ts`, `api/games/session.ts`, `api/games/state.ts`, `api/games/answer.ts`, `api/games/kick.ts`.
   - Unit tests for API pure logic & handler validation (`tests/unit/games-api.test.ts`).
5. **Host & Player UI (`#29`, `#30`):**
   - `src/lib/audio.ts` (Web Audio API lobby/timer/podium synthesizer).
   - `src/features/host/GameOptionsModal.tsx` & `src/features/host/HostGamePage.tsx` (Lobby, Question Intro/Active/Reveal bar chart, Scoreboard, Animated Podium + Replay).
   - `src/features/player/JoinPage.tsx` (replacing U1 stub at `src/features/join/JoinPage.tsx` or importing cleanly) & `src/features/player/PlayPage.tsx`.
   - Wire `Host live` in `LibraryPage.tsx` and `Host` button in `CreatorTopBar.tsx` -> `GameOptionsModal` -> `/host/:gameId`.
6. **Playwright E2E (`#31`):**
   - Multi-context Playwright E2E test simulating **1 Host browser + 2 Player mobile browsers** (intercepting `/api/games/*` + Realtime broadcast via deterministic test bridge or mocked in-memory hub inside Playwright `page.route`!) running through the full loop: Create Lobby -> Join 2 Players (incl. reconnect + kick test) -> Question Active -> Answer Submission (fast vs slow) -> Reveal Distribution -> Top-5 Scoreboard -> Animated Top-3 Podium -> Ended!
   - Also check `axe` accessibility on `/join`, `/play/:id`, and `/host/:id`.


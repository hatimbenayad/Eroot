# Unit U8 Implementation Plan

1. **Migration (`0004_u8_teams_challenges.sql`):** Add `teams` table, `players.team_id`, and `challenge_deadline`, `challenge_timer_enabled`, `challenge_accuracy_only` columns on `games`.
2. **Pure Team & Challenge Scoring Core (`shared/scoring/team.ts`, `shared/schemas/game.ts`):**
   - Extend `gameOptionsSchema` with `mode: z.enum(['classic', 'team']).default('classic')` and `teams`.
   - Implement `computeTeamStandings(teams, players, answers)` averaging member scores per question.
   - Support `accuracyOnly` option in `evaluateSlideAnswer` / `calculateSpeedPoints`.
3. **Server APIs (`api/games/*` team updates + `api/challenges/index.ts` + `api/challenges/play.ts`):**
   - Update `api/games/create.ts`, `lookup.ts`, `join.ts`, `session.ts`, `state.ts` for `teams` creation, team assignment, and `teamScoreboard`/`teamPodium`.
   - Build `api/challenges/index.ts` & `api/challenges/play.ts` staying at 10 total Vercel Functions (under Vercel Hobby 12-function limit).
4. **UI (`GameOptionsModal`, `HostGamePage`, `JoinPage`, `PlayPage`, `AssignModal`, `ChallengePlayPage`, `ChallengesPage`):**
   - Update `GameOptionsModal`, `HostGamePage`, `JoinPage`, `PlayPage` for Team Mode.
   - Build `AssignModal`, `ChallengePlayPage` (`/challenge/:pin`), and `ChallengesPage` (`/challenges`) + Library `Assign` button.
5. **Tests:** Vitest unit tests for `computeTeamStandings`, accuracy-only challenge scoring, and challenge Zod schemas.


# Unit U8 Specification — Team Mode & Self-Paced Challenges

- **Epic:** `#50` `[U8] Team Mode & Self-Paced Challenges`
- **Story:** `#51` (`US-010` — Team Mode & Assign Self-Paced Challenges)
- **Milestone:** `R3` (`v1.0.0`)
- **Requirements:** `FR-041`, `FR-050`, `FR-051`, `FR-052`

---

## 1. Scope & Behaviour

### 1.1 Team Mode (`2–5` Teams) (`#52`)
- **Launch Options:** `GameOptionsModal` allows switching between `Classic (PvP)` and `Team mode`, configuring 2–5 named, coloured teams (`teamCount`, `teams: [{ name, colorHex }]`).
- **Player Join:** `/join` lets players select a team from the game's team list (or auto-assigns to the smallest active team if omitted).
- **Team Scoring:** Each player answers on their own device; for each scored question, each team's question score equals `Math.round(sum(memberScoresOnQuestion) / activeTeamMembersCount)`. Total team score is the sum of its per-question averages.
- **Host & Player Display:** Host lobby groups joined nicknames into coloured team columns; Scoreboard & Podium rank teams alongside member counts.

### 1.2 Self-Paced Challenges ("Assign") (`#53`)
- **Assign Creation:** Host clicks **Assign** on a valid quiz -> `AssignModal` configures `deadline` (future ISO timestamp), `timerEnabled` (on/off), `accuracyOnly` (no speed bonus — full `maxPoints` on correct answers), `requirePlayerIdentifier`, `friendlyNicknames`, and `maxPlayers`.
- **Server Consolidation (Vercel Hobby <= 12 functions):**
  - `api/challenges/index.ts` handles Host `GET` (list/detail), `POST` (create challenge), and `PATCH` (update deadline, end early, remove player).
  - `api/challenges/play.ts` handles Player `GET` (lookup/resume by PIN or `gameId`) and `POST` (`join` or `submit` answer for current slide).
- **Async Player Flow (`/challenge/:pin`):**
  - Joining via `/join` with a challenge PIN automatically routes to `/challenge/:pin`.
  - Players answer one slide at a time at their own pace before `deadline`, see personal correctness/points after each submission, and resume from `localStorage` if they reload.
  - When `accuracyOnly === true`, `calculateAccuracyOnlyPoints` awards full `maxPoints` on correct answers regardless of response time.
- **Host Management (`/challenges`):**
  - Lists active & ended challenges with copyable link + PIN, live participant list, **Edit deadline**, **End early**, and **Remove player** actions.

---

## 2. Edge Cases

| Scenario | Behaviour |
|---|---|
| Player attempts to join or submit to a challenge past `challenge_deadline` or after host ended it | Server returns `409 CHALLENGE_CLOSED` and UI displays closed notice. |
| Team has 0 members | Team displays `0` score cleanly without division-by-zero `NaN`. |
| Host removes a player from an active challenge | Player `is_kicked` becomes `true`, excluded from leaderboard & reports; client session blocked. |

# Unit U4 Acceptance Tests

Traceability: `US-005` (`#22`), `US-006` (`#23`), `US-012` (`#24`), `US-013` (`#25`).

## AT-U4-01 — Speed/Accuracy Scoring & Visual-Only Streaks
- **Given** a 20s Standard (1000 pt) question
- **When** Player 1 answers correctly at `0 ms`, Player 2 answers correctly at `10,000 ms`, and Player 3 answers incorrectly
- **Then** Player 1 receives `1000`, Player 2 receives `750`, Player 3 receives `0`, and a 2-question streak displays `2x Streak` without adding bonus points.

## AT-U4-02 — Answer Key Isolation Prior to Reveal
- **Given** an active question (`state = question_active`)
- **When** `/api/games/join`, `/api/games/session`, or `/api/games/answer` returns payloads to a player
- **Then** `isCorrect` and authoritative solution keys are absent until the host transitions the game to `question_reveal`.

## AT-U4-03 — Host Lobby, Kick, Reconnect & Full Live Loop (Playwright E2E)
- **Given** a host launching a 2-question quiz (Quiz + Poll) and 2 anonymous players on mobile viewports (`390x844`)
- **When** the host starts the lobby, kicks a disruptive 3rd player, runs both questions (one player refreshes mid-game and reconnects), reveals distributions, views scoreboard, replays podium, and ends the game
- **Then** both players see accurate personal scores/ranks, the kicked player is blocked, reconnect preserves score, and the game transitions cleanly to `ended`.

## AT-U4-04 — Nickname Moderation & Friendly Nickname Generator
- **Given** a blocked profanity nickname submitted on `/join`
- **When** validated by `isNicknameClean` / `/api/games/join`
- **Then** the join fails with a clear inline error unless `friendlyNicknames` auto-assigns a safe generated nickname.


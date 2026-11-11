# ADR-0002: Server-Side Scoring Formula, Visual-Only Streaks, and Immutable Game Snapshots

- **Status:** Accepted
- **Date:** 2026-11-11
- **Phase:** Inception

## Context

Live quiz fairness depends on deterministic, tamper-resistant scoring across variable network latencies and ensuring that edits made by a host in the Creator never break an ongoing live game or historical report. Additionally, the role of answer streaks in point calculation needed an explicit product decision.

## Decision

1. **Base Speed/Accuracy Scoring Formula:**
   - Incorrect or unanswered submissions always score `0` (no negative points).
   - Standard single-correct questions use:
     `points = Math.round((1 - (responseMs / questionMs) / 2) * maxPoints)`
     where `responseMs = clamp(serverReceivedAt - questionStartedAt, 0, questionMs)` and `maxPoints` is `1000` (Standard), `2000` (Double points), or `0` (No points).
   - **Multi-select (R2):** If any selected option is wrong, score is `0`. Otherwise score is `Math.round(basePoints * (correctPickedCount / totalCorrectCount))`.
   - **Slider (R2) / Pin answer (R3):** Full `basePoints` inside configured tolerance; distance-graded partial credit may be added as an optional toggle in R3 without altering the base formula.
   - **Opinion types & Media slides:** Always score `0`.
   - **Self-paced "accuracy only" mode (R3):** Correct answers receive full `maxPoints` regardless of `responseMs`.
   - **Team mode (R3):** Team score for a question is the rounded arithmetic mean of its active members' question scores.
2. **Streaks as Visual Indicator Only:**
   - Consecutive correct answers increment each player's `streak` counter, displayed as a streak badge on player feedback screens, **without** adding bonus points to the score. This keeps scores transparent and directly predictable from response time and accuracy.
3. **Immutable Quiz Snapshots:**
   - Creating a live game or self-paced challenge copies the validated quiz slides (including authoritative answer keys) into `games.quiz_snapshot` (JSONB). Live gameplay, scoring, and post-game reports read from `quiz_snapshot`, never from mutable `quizzes`/`slides` rows.

## Consequences

- **Positive:** Deterministic scoring easily covered 100% by Vitest unit tests; zero risk of mid-game creator edits corrupting active games or reports; transparent scoring for players.
- **Negative:** Slight server-to-client clock skew (e.g., 100-300 ms) means a player's local countdown may differ slightly from `serverReceivedAt - questionStartedAt`. Mitigated by clamping `responseMs` within `[0, questionMs]` and applying a small grace window (e.g., 500 ms after question close for in-flight requests).


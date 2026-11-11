# Unit U9 Specification — Spatial & Collaborative Types (Pin Answer, Drop Pin, Brainstorm)

- **Epic:** `#54` `[U9] Spatial & Collaborative Types`
- **Story:** `#55` (`US-011` — Pin Answer, Drop Pin, Two-Phase Brainstorm)
- **Milestone:** `R3` (`v1.0.0`)
- **Requirements:** `FR-015`, `FR-016`, `FR-042`

---

## 1. Scope & Behaviour

### 1.1 `pin_answer` (Scored Knowledge Question) (`#56`)
- **Creator:** Host attaches a target image (`mediaUrl`) and defines a normalized target region (`circle` via `{ shape: 'circle', cx, cy, radius }` or `polygon` via `{ shape: 'polygon', points: [{ x, y }, ...] }`, all normalized to `[0, 1]`).
- **Sanitization:** `sanitizeSlideForPlayer` strips `target` coordinates from `PublicSlide` before sending state to players, exposing only `pinConfig: { hasTarget: true, hint }`.
- **Player:** Sees the question image (or coordinate board when question shown on devices) and clicks/taps to place a single normalized pin `(x, y)` before submitting.
- **Server Evaluation:** `isPointInPinTarget` checks Euclidean radius (for circles) or ray-casting winding intersection (for polygons). Awards `calculateSpeedPoints` (`Standard`/`Double`/`No points`) if inside target, else `0`.
- **Host Reveal:** Renders the image with the correct target region overlay plus all player pins marked green (hit) or red (miss).

### 1.2 `drop_pin` (Opinion Spatial Heatmap) (`#57`)
- **Creator:** Host attaches an image (`mediaUrl`) and optional prompt hint; `pointsMode` is always `'none'`.
- **Player:** Taps anywhere on the image canvas to drop a normalized pin `(x, y)`.
- **Host Reveal:** Renders the image with all dropped pins plus spatial cluster/heatmap density bubbles showing hot zones across players.

### 1.3 `brainstorm` (Two-Phase Collect & Upvote) (`#57`)
- **Creator:** Prompt title + hint; `pointsMode` is always `'none'`.
- **Phase 1 (`question_active`):** Players submit up to 3 short ideas (`1–80` chars each), stored server-side on `answers.payload`.
- **Phase 2 (`question_reveal` Voting & Ranking):** When the host reveals the slide, all submitted ideas are published in `revealPayload.brainstormIdeas` sorted by vote count. During reveal, players can toggle upvotes (up to 3 ideas per player) via `api/games/answer.ts`; the server recomputes vote tallies atomically, persists `reveal_payload`, and broadcasts `state_change` so host and devices see live ranking updates without exceeding the 12-function Vercel Hobby cap.

---

## 2. Edge Cases

| Scenario | Behaviour |
|---|---|
| Pin answer submitted without image or polygon `< 3` points in Creator | Slide shows `!` invalid badge and blocks publish/host. |
| Malicious player sends `x > 1` or `y < 0` | Zod rejects payload with `400 INVALID_REQUEST`. |
| Player submits > 3 ideas or > 3 votes on Brainstorm | Server enforces max 3 ideas and max 3 upvotes per player (`409` or clipped cleanly). |

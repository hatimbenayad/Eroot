# Unit U5 Acceptance Tests

Traceability: `US-007` (`#33`), `FR-010`, `FR-016`–`FR-022`, `FR-081`.

## AT-U5-01 — Google OAuth Action on `/auth`
- **Given** a visitor on `/auth`
- **When** they click `Continue with Google`
- **Then** `signInWithOAuth({ provider: 'google' })` is invoked preserving any `?redirect=` path.

## AT-U5-02 — Multi-Select Proportional & Zero-on-Wrong Scoring
- **Given** a `Multi-select` quiz slide with 2 correct options (`A`, `C`) and `1000` max points at `0 ms`
- **When** Player 1 selects `[A]` -> receives `500`; Player 2 selects `[A, C]` -> receives `1000`; Player 3 selects `[A, B]` -> receives `0`.

## AT-U5-03 — Type Answer, Slider & Puzzle Scoring + Sanitization
- **Given** `Type answer` (accepted `"Rabat"`), `Slider` (`correct: 42, tolerance: 3`), and `Puzzle` (`[1,2,3,4]`)
- **When** sanitized for players
- **Then** accepted text, correct slider target, and target puzzle order are stripped; server scoring matches `"  rabat  "`, `45`, and `[1,2,3,4]`.

## AT-U5-04 — Opinion Visualizations & Safe Video Embed
- **Given** `NPS scale` submissions `[10, 9, 5, 8]` (2 promoters, 1 detractor, 1 passive)
- **When** revealed on Host stage
- **Then** NPS displays `25` (`50% - 25%`) and `0` points are awarded; `Video` slides convert YouTube links to `youtube-nocookie.com/embed/...` and reject unsafe schemes.

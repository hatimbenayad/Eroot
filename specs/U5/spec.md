# Unit U5 Specification — Question Types R2 & Google OAuth

- **Epic:** `#32` `[U5] Question Types R2 & Google OAuth`
- **Story:** `#33` (`US-007` — Google OAuth & R2 Question/Opinion/Media Suite)
- **Milestone:** `R2` (`v0.2.0`)
- **Requirements:** `FR-010` (R2 extensions), `FR-016`–`FR-022`, `FR-081`

---

## 1. Scope & Behaviour

### 1.1 Google OAuth (`#34`)
- `/auth` displays a **Continue with Google** button triggering `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`.
- Preserves `?redirect=...` query parameter across the OAuth round-trip via `redirectTo`.

### 1.2 Multi-Select Quiz Mode (`#35`)
- `PropertiesPanel` unlocks **Answer options**: `Single select` vs `Multi-select` for `quiz` slides.
- Server scoring (`evaluateSlideAnswer`):
  - Player submits `{ optionIds: string[] }` (`min 1`).
  - If any selected `optionId` has `isCorrect === false`, score is **`0`** and `isCorrect = false`.
  - Otherwise (`wrongCount === 0 && correctPicked > 0`), score is `Math.round(baseSpeedPoints * (correctPicked / totalCorrect))`, and `isCorrect = true`.
- Player UI renders selectable tiles with active selection badges and a **Submit answers** CTA.

### 1.3 R2 Scored Types: Type Answer, Slider & Puzzle (`#36`)
- **`type_answer`:**
  - Creator defines up to 6 accepted short strings (`<= 20` chars each).
  - Player types response (`maxLength=20`) and submits `{ text }`.
  - Server normalizes `.trim().toLowerCase()` and awards speed points if matched against any accepted answer.
  - Sanitizer strips `acceptedAnswers` prior to reveal.
- **`slider`:**
  - Creator sets `min`, `max`, `step`, optional `unit`, `correctValue`, and `tolerance` (`>= 0`).
  - Player adjusts range slider and submits `{ value: number }`.
  - Server awards speed points when `Math.abs(value - correctValue) <= tolerance`.
  - Sanitizer strips `correctValue` and `tolerance` prior to reveal.
- **`puzzle`:**
  - Creator defines 4 ordered items (`0..3`).
  - Sanitizer presents shuffled `items` without target ordering indices prior to reveal.
  - Player reorders items using accessible Move Up / Move Down buttons and submits `{ order: string[] }`.
  - Server awards speed points only when all 4 item IDs match the target sequence identically.

### 1.4 R2 Opinion Types: Scale, NPS Scale, Word Cloud & Open-Ended (`#37`)
All award `0` points (`pointsMode = 'none'`, `isCorrect = null`):
- **`scale`:** Configurable `1–5` (or `1–10`) rating with `minLabel` & `maxLabel`; host reveal shows bar distribution and arithmetic mean.
- **`nps_scale`:** Fixed `0–10` scale; host reveal computes and displays **NPS** (`% Promoters (9-10) - % Detractors (0-6)`).
- **`word_cloud`:** Player submits short phrase (`<= 30` chars); host reveal aggregates normalized frequencies and renders a weighted word cloud.
- **`open_ended`:** Player submits free text (`<= 250` chars); host reveal displays all response cards.

### 1.5 R2 Media Slides, Per-Answer Images & Image Reveal (`#38`)
- **6 Media Slides (`pointsMode = 'none'`, skip scoreboard):**
  1. `big_title` (`title` + `subtitle`)
  2. `title_text` (`title` + `body`)
  3. `bullet_points` (`title` + up to 6 bullets)
  4. `quote` (`title` quote text + `author`)
  5. `big_media` (`title` caption + focal `mediaUrl`)
  6. `video` (`title` + safe YouTube/URL embed converted via `parseSafeVideoEmbed`)
- **Per-answer images:** `Quiz` and `Poll` tiles in Creator support uploading/removing a tile `imageUrl` (`<= 5 MB` in `quiz-media` bucket).
- **Image reveal:** Optional `mediaReveal` toggle in `PropertiesPanel` gradually unblurs/uncovers the slide image during `question_active`.

---

## 2. Edge Cases

| Scenario | Behaviour |
|---|---|
| Malicious `javascript:` or invalid video URL in `video` slide | `parseSafeVideoEmbed()` rejects non-`https:` URLs and marks slide invalid in Creator validation. |
| Empty string or whitespace submitted on `word_cloud` / `open_ended` / `type_answer` | Server & client reject empty submission (`400 INVALID_REQUEST`). |
| Multi-select with 2 correct answers: player selects 1 correct + 1 wrong | Score is strictly `0`, `isCorrect: false`. |
| Puzzle created with 4 items | Live snapshot shuffles initial display order so players never receive the sorted solution by default. |

# Unit U3 Specification — Question Types R1

- **Epic:** `#16` `[U3] Question Types R1`
- **Story:** `#17` (`US-004` — Core R1 Slide Types: Quiz, True/False, Poll & Classic Slide)
- **Milestone:** `R1 MVP` (`v0.1.0`)
- **Requirements:** `FR-005`, `FR-008`, `FR-012`, `FR-013`, `FR-014`, `FR-015`, `NFR-003`, `NFR-005`

---

## 1. Scope & Behaviour

### 1.1 Shared Zod Schemas & Player Sanitization (`#18`)
- Define runtime Zod validation schemas in `shared/schemas/slide.ts` for all 4 R1 slide types:
  - `quiz`: `title` non-empty (`<= 200`), 2–6 options with >= 2 non-empty option texts (all present options beyond 2 or added slots valid), and >= 1 filled option marked `isCorrect: true`.
  - `true_false`: `title` non-empty, exactly 2 options (`True`, `False`), exactly 1 `isCorrect: true`.
  - `poll`: `title` non-empty, 2–4 options with >= 2 non-empty options, `pointsMode === 'none'`, zero `isCorrect` flags.
  - `classic`: `title` non-empty (`<= 200`), non-empty `body` or `mediaUrl`, `pointsMode === 'none'`.
- Implement `sanitizeSlideForPlayer(slide)` in `shared/schemas/sanitizer.ts` which strips `isCorrect` from all options and drops empty trailing options on Quiz/Poll so player devices receive only valid selectable choices prior to reveal.

### 1.2 Add-Slide Picker Modal (`#19`)
- Clicking `+ Add` in `SlideSidebar` opens `AddSlideModal` with three tabs:
  - **`Add`**: organized into 3 groups (*Test knowledge*, *Collect opinions*, *Media slides*).
    - R1 active clickable cards: `Quiz`, `True or false`, `Poll`, `Classic`.
    - Upcoming R2/R3 types appear cleanly disabled with release badges (`R2` / `R3`) so the catalog structure matches the product spec without dead broken handlers.
  - **`Find`**: informational R2 preview state (*Question bank search unlocks in R2*).
  - **`Import`**: informational R2 preview state (*Spreadsheet `.xlsx` / `.csv` import unlocks in R2*).
  - **Explicitly excluded:** NO `Generate` tab and NO sparkle `Create` AI button.
- Selecting an R1 slide type inserts the new slide directly after the active slide, selects it, and closes the modal.

### 1.3 Full R1 Slide Editors & Previews (`#20`)
- **Quiz:** Supports **2 to 6** options (users can remove down to 2 options or click `Add more answers` up to 6), multiple correct checkmarks allowed, geometric colour+shape badges (`A–F`).
- **True or false:** Fixed 2-option layout (`True` = Red Triangle, `False` = Blue Diamond) with mutually exclusive correct-answer toggle.
- **Poll:** Supports **2 to 4** options (can remove down to 2 or add up to 4), no correct checkmarks, `Points` forced to `No points (0)`, Preview displays poll bar distribution preview.
- **Classic:** Heading (`title`), body textarea (`body`), optional image, `Points` forced to `No points (0)`, Preview renders clean informational slide layout.
- Type switching in `PropertiesPanel` preserves `title`, `mediaUrl`, `timeLimit`, and compatible option texts when switching between `quiz` and `poll`.

---

## 2. Edge Cases

| Scenario | Behaviour |
|---|---|
| Switching a `Quiz` with 6 options to `Poll` | Preserves the first 4 option texts, strips `isCorrect`, sets `pointsMode = 'none'`. |
| Switching a `Quiz` or `True/False` to `Classic` | Preserves heading (`title`) and image (`mediaUrl`), initializes `content.body = ''`, sets `pointsMode = 'none'`. |
| Quiz has 4 default slots where slots 3 and 4 are left blank | Valid as long as slots 1 and 2 are filled and >= 1 filled slot is marked correct; `sanitizeSlideForPlayer` filters out blank optional slots on live play. |
| Poll has 3rd option left blank | Valid as long as >= 2 options are filled; `sanitizeSlideForPlayer` omits blank options. |

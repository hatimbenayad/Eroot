# Unit U2 Acceptance Tests

Traceability: `US-002` (`#9`), `US-003` (`#10`), `FR-001`–`FR-011`.

## AT-U2-01 — Three-Pane Creator Layout & No AI / No Upgrade UI
- **Given** an authenticated host opening `/creator/:quizId`
- **When** the Creator renders
- **Then** the top bar (`Enter title...`, Settings, autosave status, Preview, Exit, Save), left slide sidebar (`+ Add`), center canvas, and right inspector (`Properties` & `Themes` tabs + `Help`) render cleanly with zero AI or Upgrade buttons.

## AT-U2-02 — Inline Purple Validation Tooltips & Save Gate
- **Given** a slide missing question text or Answer 1 or correct selection
- **When** viewed in the Creator
- **Then** the sidebar thumbnail shows a purple `!` badge, purple tooltips describe missing fields, and clicking **Save** blocks publishing and focuses the first invalid slide.

## AT-U2-03 — Drag-and-Drop / Keyboard Reordering, Duplicate & Apply-to-All Time Limit
- **Given** a quiz with 2+ slides
- **When** the creator duplicates a slide, reorders slides, and clicks `Apply to all questions` on time limit `30s`
- **Then** slide numbering updates (`1`, `2`, `3`), all question slides have `timeLimit === 30`, and autosave triggers.

## AT-U2-04 — Themes & Creator Preview Mode
- **Given** a valid quiz and one of the 8 Eroot themes selected
- **When** the creator clicks **Preview**
- **Then** the preview modal steps through slides under the selected theme without calling live game endpoints.

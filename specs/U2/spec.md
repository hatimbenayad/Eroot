# Unit U2 Specification — Creator Core

- **Epic:** `#8` `[U2] Creator Core`
- **Stories:** `#9` (`US-002`), `#10` (`US-003`)
- **Milestone:** `R1 MVP` (`v0.1.0`)
- **Requirements:** `FR-001`, `FR-002`, `FR-003`, `FR-004`, `FR-006`, `FR-007`, `FR-008`, `FR-009`, `FR-010` (R1 question image upload), `FR-011`

---

## 1. Scope & Behaviour

### 1.1 Library Integration (`/library`)
- Displays the authenticated host's quizzes ordered by `updated_at desc`.
- Empty state shows a primary **Create Quiz** button.
- Each quiz card shows title (or `"Untitled quiz"`), cover thumbnail (or theme swatch), slide count, validity badge (`Draft` vs `Ready`), and actions: **Edit** (`/creator/:quizId`), **Duplicate**, **Delete** (confirmation dialog), and **Host Live** (disabled until `is_valid === true`; launches U4 lobby once U4 lands).

### 1.2 Three-Pane Creator Workspace (`/creator/:quizId`)
- **Top Bar:**
  - `ErootLogo`, editable quiz title input (`placeholder="Enter title..."`), **Settings** button, live autosave status badge (`Saving...`, `Saved to: Your drafts`, `Error saving — Retry`), **Preview** (eye) button, **Exit** link (`/library`), and **Save** button.
  - Zero AI features (`Generate` / `Create`) and zero `Upgrade` / paywall UI.
- **Left Sidebar (Slide List):**
  - Numbered vertical list (`1 Quiz`, `2 Quiz`, ...) displaying slide type label, truncated question text, time-limit bubble (`20`), media indicator, and mini answer tile indicators.
  - Selected slide shows an active blue/indigo outline (`ring-2 ring-indigo-600`).
  - Hover and keyboard focus reveal **Duplicate** and **Delete** icons on the thumbnail left edge (delete disabled when only 1 slide remains).
  - Incomplete/invalid slides show a purple `!` badge (`bg-violet-600 text-white`).
  - Reordering via `@dnd-kit/sortable` drag-and-drop plus accessible Move Up / Move Down controls updates `position` (`0..n-1`).
  - Blue **`+ Add`** button below the list inserts a new slide (expanded into full Add-slide modal in U3).
- **Center Canvas:**
  - Large question text input (`"Start typing your question"`), max 200 characters, with inline purple validation tooltip when empty.
  - Media dropzone (`"Upload file or drag here to upload"`, PNG/JPG/WebP/GIF `<= 5 MB`) uploading to Supabase Storage bucket `quiz-media` under `<uid>/<quizId>/...` and recording a row in `media_assets`, plus remove button.
  - Slide answer editor area (renders default `Quiz` 2x2 coloured geometric tile editor in U2; U3 extends to full 2–6 tiles + True/False + Poll + Classic).
- **Right Panel (Properties / Themes + Help):**
  - Tabs: **Properties** and **Themes**, plus a **Help** button opening a modal with shortcuts and validation tips.
  - **Properties Tab:**
    - `Question type` select (preserving compatible `title`, `mediaUrl`, `timeLimit`, `pointsMode`).
    - `Time limit` select (`5, 10, 20, 30, 60, 90, 120, 240` s) + **"Apply to all questions"** button.
    - `Answer options` select (`Single select` active in R1).
    - `Points` select (`Standard (1000)`, `Double points (2000)`, `No points (0)`).
    - Bottom **Duplicate** and **Delete** slide buttons.
  - **Themes Tab:**
    - 8 original Eroot themes (`indigo-stage`, `midnight-slate`, `ocean-current`, `emerald-forest`, `sunset-terracotta`, `royal-plum`, `warm-sand`, `nordic-mist`), updating `quizzes.theme_id` and styling the canvas background/preview immediately.

### 1.3 Settings Modal
- Edits `title`, `description`, `visibility` (`private`, `link`, `public`), `coverImageUrl` (file upload to `quiz-media`), `language` (`en` in R1), and `musicPreset` (`chill-pulse`, `arcade-focus`, `bright-synth`, `silent`).

### 1.4 Inline Validation & Publishing Gate
- Pure validation helper `validateSlide(slide)` and `validateQuiz(quiz, slides)` under `shared/validation/quiz-validation.ts`:
  - Returns field-level error codes (`QUESTION_EMPTY`, `ANSWER_1_EMPTY`, `ANSWER_2_EMPTY`, `NO_CORRECT_ANSWER`, etc.).
  - Purple tooltip callouts point to empty fields on the active slide.
  - Purple `!` badge appears on any invalid slide in the sidebar.
  - Clicking **Save** when invalid highlights and switches to the first invalid slide and keeps `is_published = false`, `is_valid = false`. When all slides pass, persists `is_valid = true`, `is_published = true`.

### 1.5 Debounced Autosave
- Any edit marks `saveStatus = 'dirty'` and debounces (`800 ms`) persistence of quiz metadata + slides to Supabase (`quizzes` + `slides` upsert/sync), setting `saveStatus = 'saved'` (`Saved to: Your drafts`) on success or `'error'` with a **Retry** button on failure.

### 1.6 Creator Preview Mode
- Fullscreen/modal simulator rendering the current quiz using the selected Eroot theme, allowing the creator to step through slides (`Previous` / `Next` / `Reveal Answer`) without writing to `games` or `reports`.

---

## 2. Edge Cases & Error States

| Scenario | Behaviour |
|---|---|
| Unsupported file type or file `> 5 MB` dropped on media box | Reject client-side immediately with inline error alert; do not call Storage API. |
| Network failure during autosave | Top bar shows `"Save failed — Retry"` button; dirty local state is preserved in Zustand store. |
| Quiz ID does not exist or belongs to another user | Render `"Quiz not found"` error card with button back to `/library`. |
| Unsaved changes when clicking `Exit` while saving | Flush pending save before navigating, or warn if save failed. |
| Deleting the currently selected slide | Selection automatically moves to the nearest remaining slide (`index - 1` or `0`). |

# Unit U2 Implementation Plan

1. **Dependencies:** Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for accessible drag-and-drop slide reordering.
2. **Shared Domain & Validation (`#14` foundation):**
   - `shared/constants/themes.ts`: 8 original Eroot themes with CSS classes & contrast-safe text colors.
   - `shared/schemas/slide.ts`: Zod schemas for quiz metadata and R1 slide payloads (starter `quiz` + clean union hook for U3).
   - `shared/validation/quiz-validation.ts`: Pure `validateSlide()` & `validateQuiz()` returning structured field errors (`question`, `answers`, `correct`).
3. **Persistence & Media Layer (`#12`, `#15`):**
   - `src/features/creator/api.ts`: Supabase queries/mutations for `fetchQuizzes`, `createQuiz`, `duplicateQuiz`, `deleteQuiz`, `fetchQuizWithSlides`, `saveQuizAndSlides`, and `uploadQuizMedia`.
   - `src/features/creator/store.ts`: Zustand Creator workspace store managing `quiz`, `slides`, `activeSlideId`, `saveStatus`, `validationMap`, reordering, duplicate/delete, and `applyTimeLimitToAll`.
4. **Creator UI (`#11`, `#12`, `#13`, `#14`, `#15`):**
   - `src/features/library/LibraryPage.tsx`: Real quiz listing, create, duplicate, delete, validity status.
   - `src/features/creator/components/`: `CreatorTopBar`, `SlideSidebar` (dnd-kit + keyboard reorder + `!` badge), `SlideCanvas` (question input + purple tooltips + media upload dropzone + tile editor), `PropertiesPanel` (`Properties` & `Themes` tabs + `HelpDialog`), `SettingsDialog`, `CreatorPreviewModal`.
   - Wire `/creator/:quizId` route inside `RequireAuth` (full-bleed studio without `HostAppShell` header so the Creator top bar owns the viewport cleanly!).
5. **Testing:**
   - Unit tests for `validateSlide`, `validateQuiz`, `themes`, and Zustand Creator store actions (`reorder`, `duplicate`, `delete`, `applyTimeLimitToAll`).
   - Playwright E2E test (with mocked Supabase REST/Auth routes or deterministic test route/store) verifying three-pane render, inline purple validation tooltips, slide reordering, theme switch, and preview modal.

# Unit U3 Implementation Plan

1. **Shared Zod Schemas & Sanitizer (`#18`):**
   - Extend `shared/schemas/slide.ts` with `slideSchema` discriminated/validated per type (`quiz`, `true_false`, `poll`, `classic`).
   - Create `shared/schemas/sanitizer.ts` with `sanitizeSlideForPlayer()` and `sanitizeQuizSnapshotForPlayer()`.
   - Update `shared/validation/quiz-validation.ts` to handle Quiz 2–6 options and Poll 2–4 options consistently.
2. **Add-Slide Picker Modal (`#19`):**
   - Build `src/features/creator/components/AddSlideModal.tsx` with `Add` (3 groups), `Find` (R2 notice), and `Import` (R2 notice) tabs — zero `Generate` tab.
   - Connect `SlideSidebar`'s `+ Add` button in `CreatorPage.tsx` to open `AddSlideModal`.
3. **Full R1 Editors & Previews (`#20`):**
   - Refine `SlideCanvas.tsx` so Quiz allows removing options down to 2 (`options.length > 2`) and adding up to 6, Poll allows adding/removing between 2 and 4 options, and True/False renders crisp 2-tile toggle.
   - Refine `CreatorPreviewModal.tsx` to omit blank optional options, show Poll simulated bar preview, and handle Classic slides cleanly.
4. **Tests:**
   - Unit tests for Zod `slideSchema`, `sanitizeSlideForPlayer` (ensuring `isCorrect` is completely stripped), type switching (`quiz -> poll -> classic -> true_false`), and RTL tests for `AddSlideModal` + Quiz/Poll/TrueFalse/Classic creation and validation.

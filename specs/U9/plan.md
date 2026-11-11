# Unit U9 Plan — Spatial & Collaborative Types

1. Extend `shared/schemas/slide.ts` (`pin_answer`, `drop_pin`, `brainstorm` types, `PinTarget` union, `createDefaultSlide`), `shared/schemas/sanitizer.ts` (strip `pin_answer.target`), and `shared/validation/quiz-validation.ts` (validate image + target geometry).
2. Add geometry helpers (`isPointInPinTarget`) and U9 scoring cases in `shared/scoring/scoring.ts`.
3. Extend `shared/schemas/game.ts` (`pin`, `brainstormAction`, `ideaId`, `RevealPayload` fields) and wire `api/games/answer.ts` + `api/games/state.ts` for spatial pins and two-phase brainstorm submit/upvote (reusing the existing 10 endpoints).
4. Add Creator editors in `src/features/creator/components/R2SlideEditors.tsx` (`PinTargetEditor` supporting interactive circle & polygon editing on canvas) and unlock R3 types in `AddSlideModal.tsx` & `PropertiesPanel.tsx`.
5. Add Host active/reveal views (`HostSlideViews.tsx`) including pin overlay + heatmap clusters + ranked brainstorm cards, and Player spatial tap canvas + brainstorm submit/upvote UI (`PlayerSlideInput.tsx` + `PlayPage.tsx`).
6. Write unit tests (`tests/unit/r3-spatial-brainstorm.test.ts`), update task tracking, run full verification, commit & push.

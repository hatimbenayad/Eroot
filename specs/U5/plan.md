# Unit U5 Implementation Plan

1. **Google OAuth (`#34`):** Extend `AuthContextValue` + `AuthProvider.tsx` with `signInWithGoogle` and render the Google OAuth button on `AuthPage.tsx`.
2. **Extended Shared Schemas, Validation & Sanitizer (`#35`–`#38`):**
   - Extend `shared/schemas/slide.ts` (`ALL_SLIDE_TYPES` / R2 types, defaults, Zod schemas, `parseSafeVideoEmbed` helper).
   - Extend `shared/validation/quiz-validation.ts` for all R2 types.
   - Extend `shared/schemas/sanitizer.ts` to strip `acceptedAnswers`, `correctValue`, `tolerance`, and target puzzle sequence while passing public fields (`min`, `max`, `step`, `unit`, shuffled puzzle items, scale labels, media slide content).
   - Extend `shared/schemas/game.ts` (`submitAnswerRequestSchema` supporting `optionId`, `optionIds`, `text`, `value`, `order`, plus rich `RevealPayload` summary fields).
   - Extend `shared/scoring/scoring.ts` (`evaluateSlideAnswer` covering `quiz` single+multi, `true_false`, `type_answer`, `slider`, `puzzle`, opinion types, and media slides).
3. **Server API Updates (`api/games/*`):**
   - `api/games/create.ts`: handle R2 slide types + puzzle deterministic/random shuffle for `public_slides` while keeping target order in `game_snapshots`.
   - `api/games/answer.ts`: validate & evaluate all R2 answer payloads via `evaluateSlideAnswer`.
   - `api/games/state.ts`: aggregate R2 reveal payloads (NPS %, word counts, open-ended responses, slider mean/values, accepted answers, puzzle sequence).
4. **Creator UI (`SlideCanvas`, `AddSlideModal`, `PropertiesPanel`, `CreatorPreviewModal`):**
   - Enable all R2 types in `AddSlideModal` and `PropertiesPanel` (unlocking `Multi-select` on Quiz + `Image reveal` toggle when media is present).
   - Build clean dedicated canvas sub-editors for `type_answer`, `slider`, `puzzle`, `scale`, `nps_scale`, `word_cloud`, `open_ended`, and the 6 media slides, plus per-answer image upload on `Quiz` & `Poll` tiles.
5. **Host & Player UI (`HostGamePage.tsx`, `PlayPage.tsx`):**
   - Render interactive Player inputs for Multi-select (`Submit`), Type Answer, Slider, Puzzle (Up/Down reorder), Scale, NPS, Word Cloud, Open-Ended, and Media waiting state.
   - Render Host active view (including gradual `mediaReveal` animation) & Host reveal visualizations (multi-select checkmarks, slider target+range, word cloud weights, NPS score card, open-ended response cards, puzzle sequence).
6. **Tests:**
   - Vitest unit tests for Multi-select, Type answer, Slider, Puzzle scoring/sanitization/validation, NPS math, video URL safety, and Creator R2 editors.


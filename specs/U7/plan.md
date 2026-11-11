# Unit U7 Implementation Plan

1. **Migration (`0003_u7_library_folders.sql`):** Add `folders` table, `quizzes.folder_id`, `quizzes.is_favourite`, and `get_shared_quiz(p_quiz_id uuid)` RPC.
2. **Shared Templates & Spreadsheet Import Core:**
   - `shared/constants/templates.ts`: 5 starter templates (`Icebreaker`, `Pub Quiz`, `Class Review`, `Team Check-in`, `Quick Trivia`).
   - `shared/import/spreadsheet.ts`: pure `parseCsvRows`, `parseImportedRows`, `buildImportTemplateCsv`, `buildImportTemplateXlsxBuffer`.
3. **API & Library Enhancements (`#47`, `#48`):**
   - Extend `src/features/creator/api.ts` with `fetchFolders`, `createFolder`, `deleteFolder`, `toggleQuizFavourite`, `moveQuizToFolder`, `updateQuizSharing`, `cloneTemplateToLibrary`, `fetchDiscoverQuizzes`, `clonePublicQuizToLibrary`, `fetchSharedQuiz`, and `searchQuestionBank`.
   - Upgrade `src/features/library/LibraryPage.tsx` with All/Drafts/Published/Favourites tabs, Folders controls, Favourite star, Move to folder, and Share dialog.
   - Build `src/features/discover/DiscoverPage.tsx` + wire `/discover` in `App.tsx` and `HostAppShell.tsx`.
4. **AddSlideModal `Find` & `Import` Tabs (`#49`):**
   - Upgrade `src/features/creator/components/AddSlideModal.tsx` and `CreatorPage.tsx` (`onInsertSlides(slides: SlideDraft[])` in `useCreatorStore`) so both `Find` question insertion and `.xlsx`/`.csv` import append cleanly to the current quiz!
5. **Tests:**
   - Vitest unit tests for `shared/import/spreadsheet.ts` (`.csv` & `.xlsx` round-trip, row validation errors, formula/length bounds), starter templates validity (`validateQuiz` passes on all 5!), and `AddSlideModal` Find/Import interaction.


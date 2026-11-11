# Unit U7 Specification — Library, Discover, Templates & Spreadsheet Import

- **Epic:** `#45` `[U7] Library, Discover, Templates & Import`
- **Story:** `#46` (`US-009` — Library Folders, Discover, Starter Templates, Find & Import)
- **Milestone:** `R2` (`v0.2.0`)
- **Requirements:** `FR-005` (R2 `Find` & `Import` tabs), `FR-070`–`FR-073`

---

## 1. Scope & Behaviour

### 1.1 My Library Organization (`#47`)
- Migration `supabase/migrations/0003_u7_library_folders.sql` adds `folders` table (RLS `owner_id = auth.uid()`) and `folder_id` + `is_favourite` columns on `quizzes`, plus `get_shared_quiz(uuid)` security-definer RPC for link-shared quizzes.
- `/library` filter tabs: **All**, **Drafts**, **Published**, **Favourites**, plus **Folders** bar (`New folder`, `All folders`, folder pills, delete empty/non-empty folder setting `folder_id = null`).
- Each quiz card supports:
  - Star/Favourite toggle (`is_favourite`)
  - Folder assignment dropdown
  - **Share** modal (toggle `Private` / `Shared by link` / `Public`, plus tags/subject metadata and copy share URL)
  - Existing Edit, Host Live, Duplicate, Delete actions.

### 1.2 Discover & 5 Starter Templates (`#48`)
- `shared/constants/templates.ts` provides **5 built-in starter templates**:
  1. *Icebreaker* (Polls & Word cloud)
  2. *Pub Quiz* (General knowledge Quiz + True/False)
  3. *Class Review* (Quiz + Type answer + Puzzle)
  4. *Team Check-in* (Scale + NPS + Open-ended)
  5. *Quick Trivia* (4-question fast Quiz)
- `/discover` (accessible from top nav & landing):
  - **Starter Templates** shelf with 1-click **Use template** (clones into user's drafts and opens `/creator/:quizId`).
  - **Public Quizzes** catalog searchable/filterable by keyword, `tag`, `subject`, and `language`, with **Copy to My Library** action.
  - Supports opening a link-shared quiz via `/discover?shared=<quizId>`.

### 1.3 Creator `Find` & `Import` Tabs (`#49`)
- **`Find` tab in `AddSlideModal`:** Searches questions across public quizzes and built-in templates by keyword, letting the creator insert any matching question as a fresh slide in the active quiz.
- **`Import` tab in `AddSlideModal`:**
  - Downloads `.xlsx` or `.csv` import template (`Type`, `Question`, `Answer 1..4`, `Time limit`, `Correct answer(s)`).
  - Parses uploaded `.xlsx` (via `exceljs`) or `.csv` (RFC-4180 parser) into candidate `SlideDraft[]`, validates every row with `validateSlide()`, displays valid count + per-row errors, and inserts valid slides on confirm.
  - Strict limits (`<= 100` rows per import, `<= 2 MB` file size).

---

## 2. Edge Cases

| Scenario | Behaviour |
|---|---|
| Uploaded spreadsheet missing required columns or empty | Display clear error alert (`"Missing required Question or Answer columns"`); do not mutate quiz. |
| Spreadsheet has 3 valid rows and 1 invalid row | Show row-level error for the invalid row while allowing importing the 3 valid questions (or fixing first). |
| Unauthenticated user clicks `Use template` or `Copy to My Library` on `/discover` | Redirect cleanly to `/auth?redirect=/discover`. |
| Link-shared quiz opened at `/discover?shared=<id>` | Loads via `get_shared_quiz` RPC without exposing other private or link-only quizzes in search. |


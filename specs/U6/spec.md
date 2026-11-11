# Unit U6 Specification — Reports & Export

- **Epic:** `#39` `[U6] Reports & Export`
- **Story:** `#40` (`US-008` — Review Reports, Export & Difficult-Questions Quiz Builder)
- **Milestone:** `R2` (`v0.2.0`)
- **Requirements:** `FR-060`–`FR-065`

---

## 1. Scope & Behaviour

### 1.1 Reports List (`/reports`) (`#41`)
- Fetches authenticated host's reports joined with basic game metadata (`quiz_id`, `player_count`, `question_count`).
- Supports:
  - Search by report title
  - Filter by mode (`All`, `Live`, `Challenge`) and date range (`All time`, `Last 7 days`, `Last 30 days`)
  - Sort by newest, oldest, or title A–Z
  - Inline/modal **Rename** report (`UPDATE reports SET title = ...`)
  - **Delete** report with confirmation dialog (`DELETE FROM reports`)

### 1.2 Report Detail (`/reports/:reportId`) (`#42`)
Pure aggregation module `shared/reports/analytics.ts` computes deterministic stats from `games`, `game_snapshots`, `players`, and `answers`:
- **Summary Tab:**
  - Key metrics: Total Players, Scored Questions, Average Accuracy %, Average Response Time (s).
  - **Difficult Questions:** any scored question with `< 35%` correct rate across active participants.
  - **Players Who Need Help:** active players with accuracy `< 50%` on scored questions.
  - **Did Not Finish:** active players who answered fewer than the total interactive questions.
- **Players Tab:**
  - Table showing Rank, Nickname, Optional **Player Identifier** (if captured), Total Score, Accuracy %, Answered count, plus expandable/scrollable per-question correctness & points breakdown.
- **Questions Tab:**
  - Per-question cards showing % Correct, Average Response Time, Option Distribution bars, and full open-ended / word-cloud / brainstorm responses.
- **Podium Replay:**
  - Button opening an interactive animated Top-3 Podium replay modal for the historical game!

### 1.3 Spreadsheet Export (`.xlsx` and `.csv`) (`#43`)
- Pure workbook/CSV builder with **CSV/Spreadsheet Formula Injection Escaping** (`escapeSpreadsheetCell()` prefixes leading `=`, `+`, `-`, `@`, `\t`, `\r` with `'`).
- Exports **Summary**, **Players**, and **Questions** sheets in `.xlsx`, and a clean formatted `.csv` export.
- Available client-side directly from the Report Detail view (for instant browser download from verified RLS-owned report data) AND backed by `/api/reports/export` if server generation is requested.

### 1.4 Play Again & Difficult-Questions Quiz Generator (`#44`)
- **Play Again:** opens `GameOptionsModal` for the original `quiz_id` (if still present in host's library).
- **Generate Difficult-Questions Quiz:** enabled whenever `difficultQuestions.length >= 3` (non-AI direct copy of those slide definitions from `game_snapshots.authoritative_slides` into a brand-new valid draft quiz `"<Title> — Practice Difficult Questions"` in `quizzes` + `slides`), then redirects to `/creator/:newQuizId`!

---

## 2. Edge Cases

| Scenario | Behaviour |
|---|---|
| Report has 0 players or 0 scored questions (e.g. Poll-only quiz) | Summary shows `0%` / `—` cleanly without `NaN` division-by-zero. |
| Fewer than 3 difficult questions (`< 35%` correct) | Button is disabled with clear helper text (`"Needs at least 3 difficult questions (<35% correct)"`). |
| Original `quiz_id` was deleted before viewing report | `Play again` shows graceful disabled tooltip; difficult-questions builder still works because slides come from `game_snapshots`! |
| Player nickname or open-ended text begins with `=SUM(...)` or `+1` | Export escaper prefixes `'` so Excel/Google Sheets never executes formulas. |


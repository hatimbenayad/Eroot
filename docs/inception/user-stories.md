# Eroot User Stories (Inception)

Stories are grouped by persona and trace to Requirements (`FR-*`, `NFR-*`) and AI-DLC Units (`U1`–`U10`).

---

## Persona A: Host / Creator

### US-001 — Host Registration & Email/Password Auth (`U1`, `R1`)
- **Requirements:** `FR-080`, `NFR-005`
- **Story:** As a host, I can register and sign in with email and password so my quizzes and reports are private to my account.
- **Acceptance Criteria:**
  - **Given** an unauthenticated visitor on `/auth`
    **When** they submit a valid email and password to sign up or sign in
    **Then** Supabase Auth authenticates the session and redirects them to `/library` without any upgrade or paywall prompts.
  - **Given** an unauthenticated visitor navigating to `/creator`, `/library`, or `/reports`
    **When** the route loads
    **Then** they are redirected to `/auth` and returned to their target route after sign-in.

### US-002 — Creator Workspace, Slide Management & Autosave (`U2`, `R1`)
- **Requirements:** `FR-001`, `FR-002`, `FR-003`, `FR-004`, `FR-007`, `FR-009`, `FR-010`, `FR-011`
- **Story:** As a creator, I can build, reorder, theme, upload images for, preview, and autosave quizzes in a three-pane editor so creating a quiz feels fast and reliable.
- **Acceptance Criteria:**
  - **Given** an authenticated creator editing a quiz in `/creator/:quizId`
    **When** they edit the title, question text, or properties
    **Then** changes debounce-save automatically and the top bar updates from `Saving...` to `Saved to: Your drafts`.
  - **Given** multiple slides in the left sidebar
    **When** the creator drags a slide handle (or uses keyboard reorder buttons)
    **Then** the slide sequence updates immediately, persists in Postgres, and keeps the active slide selected with a blue outline.
  - **Given** a slide image upload via file picker or drag-and-drop
    **When** a valid image (`<= 5 MB`, PNG/JPG/WebP) is dropped
    **Then** it uploads to Supabase Storage and renders in the slide canvas and preview.
  - **Given** the creator clicks **Preview**
    **When** preview mode opens
    **Then** they can step through slides and test answer states using the selected Eroot theme without creating a live game or report.

### US-003 — Inline Validation & Publishing Gate (`U2`, `R1`)
- **Requirements:** `FR-006`, `FR-008`
- **Story:** As a creator, I see clear inline validation hints on incomplete slides so I never launch a broken quiz.
- **Acceptance Criteria:**
  - **Given** a Quiz slide missing question text or missing a required answer or correct checkmark
    **When** the creator views the editor
    **Then** a purple `!` badge appears on the slide thumbnail and purple tooltips identify each empty/invalid field.
  - **Given** a quiz with at least one invalid slide
    **When** the creator clicks **Save & Publish** or **Host**
    **Then** publishing/hosting is blocked and focus scrolls to the first invalid slide with a clear message.

### US-004 — Core R1 Slide Types: Quiz, True/False, Poll & Classic Slide (`U3`, `R1`)
- **Requirements:** `FR-005`, `FR-008`, `FR-012`, `FR-013`, `FR-014`, `FR-015`, `NFR-003`
- **Story:** As a creator, I can add and configure Quiz (2–6 options), True or False, Poll, and Classic media slides so I can build a complete interactive session in R1.
- **Acceptance Criteria:**
  - **Given** the `+ Add` modal on the `Add` tab (no `Generate` tab present)
    **When** the creator picks `Quiz`, `True or false`, `Poll`, or `Classic`
    **Then** a new slide of that type is inserted after the current slide with sensible defaults.
  - **Given** a `Quiz` slide
    **When** the creator clicks `Add more answers`
    **Then** up to 6 distinct colour+shape tiles can be edited and >= 1 marked correct.
  - **Given** a slide with `Time limit` set and `Apply to all questions` clicked
    **When** confirmed
    **Then** all question slides in the quiz adopt that time limit.

### US-005 — Launch Live Game, Lobby & Kick Moderation (`U4`, `R1`)
- **Requirements:** `FR-030`, `FR-031`, `FR-033`, `FR-082`, `FR-083`
- **Story:** As a host, I can configure game options, open a PIN+QR lobby backed by an immutable quiz snapshot, and kick disruptive players before starting.
- **Acceptance Criteria:**
  - **Given** a valid published or draft-valid quiz
    **When** the host selects Game Options (randomize questions/answers, show question on devices, player identifier toggle, friendly nicknames, music volume) and clicks **Start Lobby**
    **Then** the server copies the quiz into `games.quiz_snapshot`, generates a unique 6–7 digit PIN and QR code, and opens the deep indigo/slate Lobby screen.
  - **Given** a player joined with an inappropriate nickname
    **When** the host clicks that player's nickname in the lobby and confirms Kick
    **Then** the player disappears from the lobby count immediately and their device displays a kicked notice while blocking reconnect with that token.

### US-006 — Run Live Questions, Reveal, Scoreboard & Final Podium (`U4`, `R1`)
- **Requirements:** `FR-034`, `FR-035`, `FR-036`, `FR-037`, `FR-038`, `FR-040`, `NFR-001`
- **Story:** As a host, I can step through questions with countdowns, distribution reveals, Top-5 scoreboards, keyboard shortcuts, and an animated podium that saves a report.
- **Acceptance Criteria:**
  - **Given** an active question on `/host/:gameId`
    **When** the timer hits zero or the host clicks **End Question** (or presses `Space`)
    **Then** the server transitions to `question_reveal`, broadcasts the correct answer(s) and option counts, and renders the bar chart on the host stage.
  - **Given** the final slide has revealed
    **When** the host advances to Podium and finishes the game
    **Then** Top 3 players animate onto the podium (with a **Replay podium** action) and a finalized report is stored automatically.

### US-007 — Google OAuth & R2 Question/Opinion/Media Suite (`U5`, `R2`)
- **Requirements:** `FR-010`, `FR-016`–`FR-022`, `FR-081`
- **Story:** As a host, I can sign in with Google and author Multi-select, Type answer, Slider, Puzzle, Scale, NPS, Word cloud, Open-ended, and 6 rich Media slides with per-answer images and YouTube embeds.
- **Acceptance Criteria:**
  - **Given** the `/auth` page
    **When** a user clicks **Continue with Google**
    **Then** Supabase OAuth completes login and routes them into `/library`.
  - **Given** any R2 question type created in `/creator`
    **When** played in a live game
    **Then** server-side validation and scoring enforce its exact rules (0 pts on any wrong multi-select pick; case-insensitive trimmed match on Type answer; tolerance check on Slider; exact order on Puzzle; 0 pts and distribution/cloud/card visualizations on opinion types).

### US-008 — Review Reports, Export & Generate Difficult-Questions Quiz (`U6`, `R2`)
- **Requirements:** `FR-060`–`FR-065`
- **Story:** As a host, I can search, inspect, replay, export (`.xlsx`/`.csv`), and turn difficult questions (`<35%` correct) into a follow-up quiz from Reports.
- **Acceptance Criteria:**
  - **Given** completed live games or challenges in `/reports`
    **When** the host searches by quiz title, filters by type/date, renames, or deletes a report
    **Then** the list updates accurately and persists changes.
  - **Given** a report detail page
    **When** `<35%` of players answered >= 3 questions correctly
    **Then** those questions appear under *Most difficult questions* and clicking **Create quiz from difficult questions** generates a valid draft copy without AI.
  - **Given** the Export menu on a report
    **When** the host downloads `.xlsx` or `.csv`
    **Then** a sanitized spreadsheet containing Summary, Players (including optional player identifier), and Questions downloads cleanly.

### US-009 — Library Folders, Discover, Starter Templates & Import/Find (`U7`, `R2`)
- **Requirements:** `FR-005`, `FR-070`–`FR-073`
- **Story:** As a creator, I can organize my quizzes in folders/favourites, copy public quizzes from Discover, start from 5 templates, search the question bank (`Find`), and import `.xlsx`/`.csv` spreadsheets.
- **Acceptance Criteria:**
  - **Given** `/library`
    **When** the user creates folders, stars favourites, duplicates, or deletes quizzes
    **Then** the library reflects changes immediately and respects visibility (`private` / `link` / `public`).
  - **Given** `/discover`
    **When** a user filters public quizzes by keyword, tag, subject, or language and clicks **Copy to Library**
    **Then** a private editable clone appears in their drafts.
  - **Given** the Creator `Import` tab
    **When** the user uploads a valid `.xlsx` or `.csv` matching the downloadable template
    **Then** validated questions preview cleanly and append to the current quiz on confirm.

### US-010 — Team Mode & Self-Paced Challenges ("Assign") (`U8`, `R3`)
- **Requirements:** `FR-041`, `FR-050`, `FR-051`, `FR-052`
- **Story:** As a host, I can run live Team Mode games (2–5 teams) and assign self-paced challenges with editable deadlines and player management.
- **Acceptance Criteria:**
  - **Given** live Game Options set to **Team mode** (2–5 named, coloured teams)
    **When** players answer a question on their devices
    **Then** each team's question score equals the mean of its members' scores and the scoreboard ranks teams clearly.
  - **Given** a valid quiz where the host clicks **Assign**
    **When** the host sets a deadline, optional timer off, and optional accuracy-only mode
    **Then** a shareable challenge URL + PIN is generated, players can finish at their own pace before the deadline, and the host can extend/close the deadline or remove a player.

### US-011 — Spatial & Collaborative Types: Pin Answer, Drop Pin, Brainstorm (`U9`, `R3`)
- **Requirements:** `FR-023`, `FR-024`, `FR-025`
- **Story:** As a creator and host, I can run image-pinning questions and two-phase Brainstorm voting slides.
- **Acceptance Criteria:**
  - **Given** a **Pin answer** slide with a target circle/polygon defined in Creator
    **When** a player taps a point on the image during live play
    **Then** normalized `[0,1]` coordinates submit to the server, scoring full points if inside the target region.
  - **Given** a **Brainstorm** slide
    **When** players submit short ideas in phase 1 and upvote ideas in phase 2
    **Then** the host stage renders ideas ranked by votes with 0 points awarded.

---

## Persona B: Player (Anonymous)

### US-012 — Mobile PIN Join, Nickname & Optional Identifier (`U4`, `R1`)
- **Requirements:** `FR-032`, `FR-082`, `NFR-003`, `NFR-004`
- **Story:** As a player on a mobile phone, I can join a game using only a PIN and nickname (plus optional host-requested identifier) without creating an account.
- **Acceptance Criteria:**
  - **Given** a player on `/join` (`360px` mobile viewport)
    **When** they enter a valid active Game PIN and pass nickname validation (or click **Random nickname**, or receive an auto-assigned friendly nickname)
    **Then** they join the lobby within 1 second, receive a `localStorage` session token, and see their nickname and "You're in!" screen.
  - **Given** a nickname matching the profanity filter or a duplicate active nickname
    **When** submitted
    **Then** the API rejects it with an accessible inline error prompting a clean nickname.

### US-013 — Geometric Answer Submission, Feedback & Reconnect (`U4`, `R1`)
- **Requirements:** `FR-035`, `FR-036`, `FR-037`, `FR-039`, `NFR-001`, `NFR-003`
- **Story:** As a player, I can tap high-contrast shape+colour tiles to answer, see my points/rank/visual streak after reveal, and resume automatically if I refresh.
- **Acceptance Criteria:**
  - **Given** an active question on a player's phone
    **When** the player inspects the network payload or page state before reveal
    **Then** no correct-answer flags or target answers exist anywhere on the client.
  - **Given** a player submits an answer at `t` ms
    **When** the question reaches `question_reveal`
    **Then** the player device displays Correct/Incorrect, points computed by `round((1 - (responseTime / questionTime) / 2) * maxPoints)`, current rank, and a visual streak indicator (no bonus points).
  - **Given** a connected player refreshes their browser tab mid-game
    **When** `/play/:gameId` reloads with the stored `localStorage` token
    **Then** the player seamlessly resumes the current game phase with their nickname, score, and streak intact.

---

## Persona C: Moderator / Operations / Accessibility

### US-014 — Abuse Protection, Spanish i18n, Accessibility & 100-Player Load Verification (`U10`, `R3`)
- **Requirements:** `FR-082`–`FR-085`, `NFR-002`–`NFR-009`
- **Story:** As an operator and user, I rely on rate-limited endpoints, full WCAG AA accessibility, Spanish language support, lightweight `/api/health` observability, and verified 100-player capacity.
- **Acceptance Criteria:**
  - **Given** repeated invalid PIN guesses or join bursts from one IP/client
    **When** the rate threshold is exceeded
    **Then** `/api/games/join` returns HTTP `429` with retry guidance without leaking whether a PIN exists.
  - **Given** a user toggles the language selector to `Español (es)`
    **When** Creator, Host, Player, or Reports screens render
    **Then** all UI navigation, labels, tooltips, and feedback strings render in Spanish.
  - **Given** Playwright `axe` scans across `/join`, `/play`, `/host`, `/creator`, `/reports` and Lighthouse on `/join`
    **When** run in CI
    **Then** zero critical/serious `axe` violations occur and `/join` meets Performance >= 90 and Accessibility >= 95.
  - **Given** the scripted ~100-player live game simulation
    **When** executed against staging/local target
    **Then** results (latency, success rate, realtime delivery) are recorded under `docs/` without connection drops or scoring inconsistencies.


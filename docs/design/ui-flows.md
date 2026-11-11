# Eroot UI Flows & Route Architecture

## 1. Surface Map & Routes

| Surface | Route(s) | Auth | Theme Direction | Primary Viewport |
|---|---|---|---|---|
| **Landing / Entry** | `/` | Public | Light clean hero + quick PIN join CTA + Host Login CTA | Responsive |
| **Host Auth** | `/auth` | Public | Clean light auth card (`email` + `password`; Google OAuth added R2) | Responsive |
| **My Library** | `/library` | Protected | Clean light workspace (`slate-50`, white cards) | Desktop / Tablet |
| **Quiz Creator** | `/creator/:quizId` | Protected | 3-pane light studio (Top bar, Slide list, Canvas, Inspector/Themes) | Desktop (`1024px+`, responsive drawer on narrow) |
| **Host Live Stage** | `/host/:gameId` | Protected | Deep indigo/slate stage (`#0f172a` -> `#1e1b4b`), large projector typography | Desktop / Projector (`1024px+`) |
| **Player Join** | `/join` | Anonymous | Bold high-contrast mobile-first PIN -> Identifier -> Nickname flow | Mobile (`360px+`) |
| **Player Live** | `/play/:gameId` | Anonymous token | Full-viewport geometric answer tiles (Red Triangle, Blue Diamond, Yellow Circle, Green Square) | Mobile (`360px+`) |
| **Reports** | `/reports`, `/reports/:reportId` | Protected | Clean light analytics workspace, lazy-loaded `exceljs` XLSX export | Desktop / Tablet |
| **Challenges** | `/challenges` | Protected | Host management of active & closed self-paced challenges (R3) | Desktop / Tablet |
| **Challenge Play** | `/challenge/:pin` | Anonymous token | Async slide-by-slide flow with optional countdown & accuracy-only scoring (R3) | Mobile (`360px+`) |
| **Discover** | `/discover` | Public/Host | Clean light search catalog (R2) | Responsive |

*(Heavy host/studio routes are lazy-loaded via `React.lazy` in `src/app/App.tsx`; an EN/ES `<LanguageSwitcher />` is available across entry, auth, join, and host shells.)*

## 2. U1 Core Flows

1. **Unauthenticated Access Guard:**
   - Navigating to `/library`, `/creator/:quizId`, `/host/:gameId`, or `/reports` without a valid Supabase session redirects to `/auth?redirect=<encodedPath>`.
   - After successful sign-in or sign-up, the router navigates back to `<redirect>` (default `/library`).
2. **Sign-Up / Sign-In Error & Loading States:**
   - Form validates email format and password length (`>= 8` chars on sign-up) via `react-hook-form` + `zod` before hitting Supabase Auth.
   - Submit button displays a clear loading spinner and `aria-busy="true"`; auth failures render an inline `role="alert"` banner with an accessible message.
3. **Unconfigured Environment Guard (Dev / Preview Resilience):**
   - If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing at runtime, the app renders a clear non-crashing setup notice instead of a blank white screen.
4. **Geometric Answer Tile Primitive (`AnswerTile`):**
   - Used across Creator (U2/U3), Preview (U2), Host Reveal (U4), and Player Play (U4).
   - Always displays: distinct background colour + distinct SVG geometric shape + accessible letter/text label (e.g., Red Triangle `A`, Blue Diamond `B`, Yellow Circle `C` with dark `#0f172a` contrast ink, Green Square `D`, plus Teal Hexagon `E` and Purple Star `F` for 5–6 options).


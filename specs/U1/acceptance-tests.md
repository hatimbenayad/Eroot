# Unit U1 Acceptance Tests

Traceability: `US-001` (`#2`), `FR-080`, `FR-084`, `FR-085`, `NFR-003`, `NFR-005`, `NFR-006`.

## AT-U1-01 — Protected Route Redirects Unauthenticated Visitor
- **Given** an unauthenticated user navigates directly to `/library`
- **When** the route resolves
- **Then** the user is redirected to `/auth?redirect=%2Flibrary` and sees the Eroot Email + Password Sign In form (with zero Google OAuth or Upgrade banners in R1).

## AT-U1-02 — Auth Validation Prevents Invalid Submission
- **Given** a visitor on `/auth`
- **When** they submit an invalid email or a password shorter than 8 characters on Sign Up
- **Then** inline accessible error messages appear and no auth API call is made.

## AT-U1-03 — Geometric Answer Tile Accessibility Redundancy
- **Given** `AnswerTile` rendered for options `0..3`
- **When** inspected in DOM and rendered styles
- **Then** each tile displays a distinct geometric SVG icon (Triangle, Diamond, Circle, Square), a letter badge (`A`–`D`), and high-contrast foreground text (including dark ink on yellow).

## AT-U1-04 — Health Endpoint Contract
- **Given** `GET /api/health`
- **When** Supabase environment variables are missing or Postgres cannot be reached
- **Then** it responds with HTTP `503` and `{ status: "degraded", database: "unconfigured" | "error" }` without leaking secrets.
- **When** Postgres connectivity check succeeds
- **Then** it responds with HTTP `200` and `{ status: "ok", database: "connected" }`.

## AT-U1-05 — Automated Accessibility Scan (`axe`)
- **Given** the rendered `/` and `/auth` pages
- **When** scanned with `@axe-core/playwright`
- **Then** zero critical or serious accessibility violations are reported.


# ADR-0003: Phased Auth (Email/Password R1, Google OAuth R2), i18n Strategy, and Lightweight Observability

- **Status:** Accepted
- **Date:** 2026-11-11
- **Phase:** Inception

## Context

We need to deliver an immediately usable MVP in R1 without external OAuth setup blockers, prepare the codebase for multi-language support without slowing down R1 velocity, and maintain clean operational visibility without introducing paid or privacy-invasive third-party trackers.

## Decision

1. **Authentication:**
   - **R1 (MVP):** Hosts sign up and log in using Supabase Auth **email + password**. Players remain **100% anonymous** using a PIN, nickname, and an opaque session token stored in `localStorage`.
   - **R2:** Add **Google OAuth** sign-in via Supabase Auth provider configuration alongside email + password.
2. **Internationalization (i18n):**
   - **R1 & R2:** All UI copy lives in structured translation dictionaries (`src/i18n/en.ts` via a lightweight typed helper or `react-i18next`) rather than hardcoded inline strings in components. English (`en`) is active in R1/R2.
   - **R3:** Add complete **Spanish (`es`)** translation dictionary and a user-facing language switcher (persisted in profile/localStorage) plus Spanish template metadata where applicable.
3. **Observability:**
   - Zero Sentry and zero third-party analytics/tracking scripts (privacy-first).
   - Provide a `GET /api/health` endpoint checking runtime status and Supabase Postgres connectivity.
   - Emit structured JSON logs from Vercel Functions (game lifecycle transitions, error codes, latency) without logging PII or secrets.

## Consequences

- **Positive:** Fast R1 delivery, zero third-party privacy footprint, zero rework when adding Spanish in R3.
- **Negative:** No automated client-side crash aggregation tool like Sentry; relies on Vercel Function logs, Playwright E2E coverage, and unit tests to catch regressions early.

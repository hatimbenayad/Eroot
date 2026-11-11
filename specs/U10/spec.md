# Unit U10 Specification — Safety, Accessibility, Spanish i18n, Performance & Ops

- **Epic:** `#58` `[U10] Safety, Accessibility, Spanish i18n, Performance & Ops`
- **Story:** `#59` (`US-014` — Production Hardening, Spanish i18n, Accessibility, Mobile Optimization & Ops)
- **Milestone:** `R3` (`v1.0.0`)
- **Requirements:** `NFR-001`, `NFR-002`, `NFR-003`, `NFR-004`, `NFR-005`, `NFR-006`, `NFR-007`, `NFR-008`

---

## 1. Scope & Behaviour

### 1.1 Spanish (`es`) i18n & Language Switcher (`#60`)
- Extend `Locale` to `'en' | 'es'` in `src/i18n/translation.ts`.
- Provide a complete Spanish translation dictionary in `src/i18n/es.ts` preserving exact structural parity with `src/i18n/en.ts`.
- Persist user locale selection in `localStorage` (`eroot_locale`), update `document.documentElement.lang` dynamically, and expose a reusable accessible `<LanguageSwitcher />` control in `LandingPage`, `HostAppShell`, `AuthPage`, and `JoinPage`.
- Update `quizSettingsSchema` (`language: z.enum(['en', 'es'])`) and `SettingsDialog` so creators can tag quizzes as English or Spanish.

### 1.2 Moderation, PIN Brute-Force Protection & Security Headers (`#61`)
- Harden `shared/moderation/nickname.ts` with expanded English + Spanish profanity stems, `@`/`$` leetspeak mapping, and repeat-character collapsing (e.g., `shhh1t`).
- Enforce rate limiting across `api/games/{lookup,join,answer}.ts`, `api/games/create.ts` (`host-create`), and `api/challenges/{index,play}.ts`.
- Configure baseline HTTP security headers in `vercel.json` (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`).

### 1.3 Accessibility, Reduced Motion & `/join` Mobile Bundle Optimization (`#62`)
- Code-split heavy creator, reports, discover, host-stage, and challenge management routes via `React.lazy` + `<Suspense>` in `src/app/App.tsx` so mobile `/join` & `/play` initial JavaScript stays lean and `exceljs` is never bundled into the player entry chunk.
- Add Playwright checks verifying `/join` on mobile (`390x844`) under `prefers-reduced-motion: reduce`, `en`/`es` language switching, zero console/page errors, and zero critical/serious `@axe-core/playwright` violations.

### 1.4 100-Player Load Sanity Benchmark & Operations Docs (`#63`)
- Implement `scripts/load-sanity.ts` (executable via `npm run load:sanity`) benchmarking 100 concurrent simulated players x 10 slides (single/multi Quiz, Slider, Pin Answer, Brainstorm, Team Mode standings), reporting p50/p95/p99 latency and payload sizing.
- Document findings in `docs/load-test-results.md`, sync `docs/design/*.md` with R2/R3 implementations, and deliver `README.md`, `CONTRIBUTING.md`, and `docs/retrospective.md`.

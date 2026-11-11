# Unit U10 Acceptance Tests

| AC | Verification Method | Expected Outcome |
|---|---|---|
| U10-AC1 (Spanish i18n parity & toggle) | Unit test (`i18n.test.ts`) + Playwright | `es` matches every key in `en`; UI switches live between English and Spanish and updates `<html lang>`. |
| U10-AC2 (Hardened moderation & headers) | Unit test (`nickname.test.ts`) + `vercel.json` check | Obscured English/Spanish profanity rejected cleanly; `vercel.json` configures `nosniff`, `DENY`, and strict referrer policy. |
| U10-AC3 (Mobile `/join` lazy split & a11y) | `vite build` + Playwright mobile & reduced-motion tests | Main bundle excludes Creator/Reports/`exceljs`; mobile `/join` passes reduced-motion, zero console errors, and 0 axe critical/serious violations. |
| U10-AC4 (100-player load sanity & ops docs) | `npm run load:sanity` + docs verification | 100 concurrent simulated players complete 10 rounds within p95 < 10 ms compute budget; results & ops docs recorded accurately. |

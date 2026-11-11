# Unit U10 Plan — Safety, Accessibility, Spanish i18n, Performance & Ops

1. Add `src/i18n/es.ts`, update `translation.ts`, `I18nProvider.tsx` (`setLocale` + `localStorage` + `document.documentElement.lang`), add `<LanguageSwitcher />` component mounted in `LandingPage`, `HostAppShell`, `AuthPage`, and `JoinPage`, and add `es` language option to `quizSettingsSchema` & `SettingsDialog`.
2. Harden `shared/moderation/nickname.ts`, verify rate limits in `api/games/create.ts` + `api/challenges/play.ts`, and add security headers to `vercel.json`.
3. Code-split `App.tsx` routes with `React.lazy` & `Suspense`, keeping `JoinPage` & `PlayPage` lean; verify bundle chunk breakdown on `vite build`.
4. Expand unit tests (`i18n.test.ts`, `nickname.test.ts`) and Playwright E2E checks (Spanish switcher, mobile `/join` reduced motion, axe scan, zero console errors).
5. Build `scripts/load-sanity.ts`, execute 100-player load benchmark -> `docs/load-test-results.md`, update `docs/design/*.md`, and author `README.md`, `CONTRIBUTING.md`, `docs/retrospective.md`.
6. Update `specs/U10/tasks.md` & `docs/inception/backlog.md`, run full verification suite, tag `v1.0.0`, push to `origin/main`, and present R3 Final Gate.

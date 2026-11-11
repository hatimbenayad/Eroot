# Contributing to Eroot

Eroot is developed using **AI-Driven Development Life Cycle (AI-DLC)** and **Spec-Driven Development (SDD)**.

## Engineering Rules

1. **Specs before code:** Every feature traces back to a written specification in `specs/U*/spec.md`, a technical plan, acceptance tests, and backlog tasks in `docs/inception/backlog.md`.
2. **Traceable Conventional Commits:** Reference the corresponding issue/task in commit messages (e.g., `feat(u9): implement Pin answer target editor (#56)`).
3. **Pure shared domain core:** Put validation, schemas, sanitizers, scoring, and state-machine logic inside `shared/` so frontend (`src/`) and Vercel Functions (`api/`) never diverge.
4. **API function budget:** Keep Vercel Serverless Functions under `/api/*` `<= 12` files (Vercel Hobby cap; currently 10 files) and import from `../_lib/` / `../../shared/` using relative paths inside `api/`.
5. **No AI generation & no paywalls:** Eroot deliberately stays 100% free with zero paywalls, upgrades, or AI content generators.
6. **Accessible by default:** Every coloured interactive choice pairs colour with geometric shape + accessible text/letter label (`AnswerTile`) and must pass `@axe-core/playwright` with zero critical or serious violations.

## Local Verification Checklist

Before committing any change on `main`, run the full verification suite:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```


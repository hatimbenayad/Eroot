# Eroot Load Sanity & Bundle Optimization Results

## 1. 100-Player Concurrent Domain Simulation (`npm run load:sanity`)

Executed locally via `node scripts/run-load-sanity.mjs` (`scripts/load-sanity.ts`) exercising the shared authoritative TypeScript modules (`shared/schemas/sanitizer.ts`, `shared/scoring/scoring.ts`, `shared/scoring/team.ts`, `shared/moderation/nickname.ts`) across a representative **100-player × 10-round live game (1,000 submissions)** mixing single/multi Quiz, Pin Answer spatial target geometry, Brainstorm idea aggregation/upvoting, and 4-team mean standings:

| Metric | Observed Measurement |
|---|---|
| Simulated players | `100` |
| Simulated slides / rounds | `10` |
| Total answer evaluations | `1,000` |
| Slide sanitization for 10 slides | `0.55 ms` |
| Sanitized `public_slides` JSON payload size | `5,002 bytes` (~4.9 KB) |
| 100-player nickname moderation + friendly generation | `0.838 ms` |
| Per-submission evaluation latency (`p50`) | `0.001 ms` |
| Per-submission evaluation latency (`p95`) | `0.002 ms` |
| Per-submission evaluation latency (`p99`) | `0.009 ms` |
| Per-submission evaluation latency (`max`) | `0.386 ms` |
| 4-team standings computation (100 members, 9 scored rounds) | `0.512 ms` |
| 100-player Brainstorm idea deduplication & vote ranking | `8.935 ms` |

### Methodology & Scope Notes
- Benchmarks pure CPU compute and payload serialization overhead of Eroot's authoritative server modules (`shared/*`) in-process on Node.js (`v22.20.0`).
- Live production concurrency also depends on Supabase Postgres connection pooling, Realtime channel fan-out (single channel `game:<id>` with batched server broadcasts), and Vercel Serverless Function cold starts (`< 12` total routes on Hobby tier).
- Per-game default capacity is capped at `max_players = 100` (configurable up to `500` in host Game Options).

---

## 2. Mobile `/join` & Route Code-Splitting Bundle Impact (`npm run build`)

Route-level `React.lazy` splitting in `src/app/App.tsx` removes Creator (`dnd-kit`), Reports (`exceljs`), Host Stage, Challenges, and Discover chunks from the initial mobile `/join` and `/play` bundle:

| Artifact | Before U10 Split (`b5185cc`) | After U10 Split |
|---|---|---|
| Main entry JS (`dist/assets/index-*.js`) | `867.03 kB` (`261.64 kB` gzip) | `473.54 kB` (`148.20 kB` gzip) |
| Lazy Creator chunk | Bundled in entry | `128.19 kB` (`36.50 kB` gzip) |
| Lazy Host Stage chunk | Bundled in entry | `47.04 kB` (`14.41 kB` gzip) |
| Lazy Library chunk | Bundled in entry | `18.57 kB` (`5.40 kB` gzip) |
| Lazy Report Detail chunk | Bundled in entry | `13.73 kB` (`4.41 kB` gzip) |
| Lazy Reports list / Discover / Challenges | Bundled in entry | `4.95–6.93 kB` each (`2.07–2.56 kB` gzip) |
| Spreadsheet XLSX export (`exceljs.min`) | Lazy (`940.19 kB`) | Lazy on Report Export only (`940.20 kB` / `271.33 kB` gzip) |


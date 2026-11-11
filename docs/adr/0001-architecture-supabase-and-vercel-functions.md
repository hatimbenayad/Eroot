# ADR-0001: Supabase + Vercel Functions as Authoritative Backend and Realtime Layer

- **Status:** Accepted
- **Date:** 2026-11-11
- **Phase:** Inception

## Context

Eroot will be hosted on Vercel as a React 18 + TypeScript + Vite SPA paired with Vercel Serverless Functions under `/api`. Vercel Functions are stateless and short-lived and cannot hold persistent WebSocket connections. Meanwhile, live quizzes require:
1. Real-time fan-out from host to up to 100 concurrent players (lobby joins, question start, reveal, scoreboard, podium, kicks).
2. Authoritative server-side timing, answer validation, and scoring so correct answers are never leaked to player clients before the reveal phase and clients cannot tamper with scores or timestamps.
3. Relational persistence, authentication, and image upload storage.

## Decision

Adopt **Supabase** (Postgres + Row Level Security + Auth + Storage + Realtime Broadcast/Presence) paired with **Vercel Functions** using the Supabase Service Role key for all privileged game state transitions and answer scoring.

- **Client -> Server (mutations):** Hosts trigger game state changes (`start`, `next`, `end_question`, `kick`, `end_game`) and players join or submit answers via HTTPS calls to `/api/games/*` Vercel Functions.
- **Server -> Postgres:** Vercel Functions validate payloads with Zod, stamp server UTC timestamps, evaluate correctness against the private quiz snapshot stored in Postgres, write scores, and broadcast public state payloads to the game's Realtime channel.
- **Supabase Realtime:** Used strictly as a pub/sub broadcast and lightweight presence layer (`game:<gameId>`). Sensitive fields (`correct_options`, `accepted_answers`, `target_zone`) are stripped from player-visible snapshots and channel broadcasts until `question_reveal`.
- **Supabase Storage:** Public/signed buckets for quiz cover images, slide media, and answer tile images with strict file-type and size limits.

## Alternatives Considered

1. **Ably or Pusher + Neon Postgres:** Adds a separate paid/metered realtime vendor, extra secret management, and split auth/storage providers. Rejected to minimize operational surface.
2. **Firebase Firestore + Cloud Functions:** Real-time listeners work well, but relational reporting queries (difficult questions <35%, player answer matrices, joins across snapshots) and RLS are cleaner in Postgres. Rejected.
3. **Pure Client-to-Supabase Postgres Changes without `/api`:** Would either expose correct answers via RLS or require complex Postgres triggers/RPCs for every question type and rate limit. Rejected in favour of explicit, unit-testable TypeScript Vercel Functions + Postgres transactional RPCs where atomicity is needed.

## Consequences

- **Positive:** Single backend platform (DB, Auth, Storage, Realtime), clean separation of public vs authoritative state, easy local/CI unit testing of scoring and state-machine modules.
- **Negative / Risks:** Supabase Free tier enforces concurrent connection (~200) and message-rate limits. To comfortably support 100 players in a live game, clients must open **at most one** Realtime channel per active game tab and avoid high-frequency presence chatter (host receives answer counts via throttled server broadcasts or debounced updates rather than 100 simultaneous full-state broadcasts per answer).


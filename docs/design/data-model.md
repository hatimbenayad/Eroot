# Eroot Data Model

## 1. Entity Relationship Overview

- **`profiles` (1) -> (*) `quizzes`**
- **`quizzes` (1) -> (*) `slides`** (ordered by `position`)
- **`profiles` (1) -> (*) `media_assets`**
- **`quizzes` (1) -> (*) `games`** (snapshot copied on launch into `game_snapshots`)
- **`games` (1) -> (1) `game_snapshots`** (RLS-restricted authoritative key store)
- **`games` (1) -> (*) `players` -> (*) `answers`**
- **`games` (1) -> (0..1) `reports`**
- *(R2 additions)* `folders`, `favourites`
- *(R3 additions)* `teams`, challenge fields on `games`

## 2. U1 Core Tables (`supabase/migrations/0001_u1_core.sql`)

### `profiles`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` | Matches Supabase Auth UID |
| `email` | `text` | `NOT NULL` | Copied from `auth.users` |
| `display_name` | `text` | `NOT NULL DEFAULT ''` | Editable host name |
| `preferred_locale` | `text` | `NOT NULL DEFAULT 'en'` | `'en' \| 'es'` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |

### `quizzes`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | |
| `owner_id` | `uuid` | `NOT NULL REFERENCES profiles(id) ON DELETE CASCADE` | Host creator |
| `title` | `text` | `NOT NULL DEFAULT ''` | Editable in Creator top bar |
| `description` | `text` | `NOT NULL DEFAULT ''` | Settings modal |
| `visibility` | `text` | `NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','link','public'))` | Share level |
| `theme_id` | `text` | `NOT NULL DEFAULT 'indigo-stage'` | Key from ~8 Eroot themes |
| `cover_image_url` | `text` | `NULL` | Uploaded cover asset |
| `language` | `text` | `NOT NULL DEFAULT 'en'` | Content language |
| `music_preset` | `text` | `NOT NULL DEFAULT 'chill-pulse'` | Synthesized lobby preset |
| `is_valid` | `boolean` | `NOT NULL DEFAULT false` | True when >=1 slide & all slides pass Zod |
| `is_published` | `boolean` | `NOT NULL DEFAULT false` | Ready to host/share |
| `tags` | `text[]` | `NOT NULL DEFAULT '{}'` | Used by Discover (R2) |
| `subject` | `text` | `NOT NULL DEFAULT ''` | Used by Discover (R2) |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |

### `slides`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | |
| `quiz_id` | `uuid` | `NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE` | |
| `position` | `integer` | `NOT NULL` | 0-indexed ordering |
| `type` | `text` | `NOT NULL` | `'quiz' \| 'true_false' \| 'poll' \| 'classic' \| ...` |
| `title` | `text` | `NOT NULL DEFAULT ''` | Question text or slide heading |
| `media_url` | `text` | `NULL` | Slide image or video URL |
| `media_reveal` | `boolean` | `NOT NULL DEFAULT false` | Gradual reveal toggle (R2) |
| `time_limit` | `integer` | `NOT NULL DEFAULT 20` | Seconds (`5,10,20,30,60,90,120,240`) |
| `points_mode` | `text` | `NOT NULL DEFAULT 'standard' CHECK (points_mode IN ('standard','double','none'))` | |
| `select_mode` | `text` | `NOT NULL DEFAULT 'single' CHECK (select_mode IN ('single','multi'))` | |
| `content` | `jsonb` | `NOT NULL DEFAULT '{}'::jsonb` | Type-specific Zod-validated JSON |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |

### `media_assets`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | |
| `owner_id` | `uuid` | `NOT NULL REFERENCES profiles(id) ON DELETE CASCADE` | |
| `storage_path` | `text` | `NOT NULL` | Object path in `quiz-media` bucket |
| `public_url` | `text` | `NOT NULL` | Resolved public URL |
| `mime_type` | `text` | `NOT NULL` | `image/png`, `image/jpeg`, `image/webp` |
| `size_bytes` | `integer` | `NOT NULL` | Validated `<= 5242880` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |

## 3. U4 Live Game Tables (Added in U4)

- `games`: `id`, `pin` (unique 7-digit string), `host_id`, `quiz_id`, `mode`, `state`, `current_slide_index`, `question_started_at`, `settings`, `max_players` (default 100), `public_slides` (sanitized slide array without answers), `created_at`, `started_at`, `ended_at`.
- `game_snapshots`: `game_id` PK, `host_id`, `authoritative_slides` JSONB (never exposed to `anon`).
- `players`: `id`, `game_id`, `nickname`, `identifier`, `session_token` (hashed or opaque UUID), `team_id`, `total_score`, `streak`, `is_kicked`, `connected_at`, `last_seen_at`.
- `answers`: `id`, `game_id`, `player_id`, `slide_id`, `payload` JSONB, `response_ms`, `points`, `is_correct`, `submitted_at` (`UNIQUE (game_id, player_id, slide_id)`).
- `reports`: `id`, `game_id`, `host_id`, `title`, `mode`, `summary_cache` JSONB, `created_at`.

## 4. Row Level Security (RLS) Rules

- `profiles`: user can `SELECT` / `UPDATE` only where `id = auth.uid()`.
- `quizzes` & `slides`: owner (`owner_id = auth.uid()`) has full CRUD; authenticated/anon users can `SELECT` only where `visibility = 'public' AND is_published = true` (and `link` lookup via explicit RPC/route).
- `media_assets`: owner has full CRUD; Storage bucket `quiz-media` allows authenticated uploads under `<uid>/...` and public read of uploaded media URLs.
- `game_snapshots`: RLS enabled with **zero** `anon` policies; accessible only by `host_id = auth.uid()` or Service Role inside Vercel Functions.

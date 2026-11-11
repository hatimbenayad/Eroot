-- Eroot U4 Live Game Engine Schema: games, game_snapshots, players, answers, reports, rate_limits

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  pin text not null unique,
  host_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid references public.quizzes(id) on delete set null,
  mode text not null default 'classic' check (mode in ('classic', 'team', 'challenge')),
  state text not null default 'lobby' check (
    state in ('lobby', 'question_intro', 'question_active', 'question_reveal', 'scoreboard', 'podium', 'ended')
  ),
  current_slide_index integer not null default 0,
  question_started_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  theme_id text not null default 'indigo-stage',
  quiz_title text not null default '',
  max_players integer not null default 100 check (max_players >= 2 and max_players <= 500),
  public_slides jsonb not null default '[]'::jsonb,
  reveal_payload jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

create index if not exists games_host_created_idx on public.games (host_id, created_at desc);
create index if not exists games_pin_active_idx on public.games (pin) where state <> 'ended';

alter table public.games enable row level security;

create policy "games_host_all"
  on public.games for all
  to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

-- Authoritative answer keys live strictly here; zero anon policies
create table if not exists public.game_snapshots (
  game_id uuid primary key references public.games(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  authoritative_slides jsonb not null
);

alter table public.game_snapshots enable row level security;

create policy "game_snapshots_host_select"
  on public.game_snapshots for select
  to authenticated
  using (host_id = auth.uid());

-- Players (anonymous session tokens + optional identifier for reports)
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  nickname text not null,
  identifier text,
  session_token text not null unique,
  total_score integer not null default 0,
  streak integer not null default 0,
  is_kicked boolean not null default false,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index if not exists players_game_nickname_active_idx
  on public.players (game_id, lower(nickname))
  where is_kicked = false;

create index if not exists players_game_score_idx
  on public.players (game_id, total_score desc, joined_at asc);

alter table public.players enable row level security;

create policy "players_host_read"
  on public.players for select
  to authenticated
  using (
    exists (
      select 1 from public.games g
      where g.id = players.game_id and g.host_id = auth.uid()
    )
  );

-- Answers
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  slide_id text not null,
  payload jsonb not null,
  response_ms integer not null check (response_ms >= 0),
  points integer not null default 0 check (points >= 0),
  is_correct boolean,
  submitted_at timestamptz not null default now(),
  unique (game_id, player_id, slide_id)
);

create index if not exists answers_game_slide_idx
  on public.answers (game_id, slide_id);

alter table public.answers enable row level security;

create policy "answers_host_read"
  on public.answers for select
  to authenticated
  using (
    exists (
      select 1 from public.games g
      where g.id = answers.game_id and g.host_id = auth.uid()
    )
  );

-- Reports (created automatically when a game ends; expanded in U6)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null unique references public.games(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  mode text not null default 'live' check (mode in ('live', 'challenge')),
  summary_cache jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reports_host_created_idx
  on public.reports (host_id, created_at desc);

alter table public.reports enable row level security;

create policy "reports_host_all"
  on public.reports for all
  to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

-- Distributed sliding-window rate limiter for Serverless functions
create table if not exists public.rate_limits (
  bucket_key text primary key,
  hit_count integer not null default 1,
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;

create or replace function public.check_rate_limit(
  p_bucket_key text,
  p_max_hits integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits (bucket_key, hit_count, window_start)
  values (p_bucket_key, 1, now())
  on conflict (bucket_key) do update
  set
    hit_count = case
      when rate_limits.window_start + make_interval(secs => p_window_seconds) <= now() then 1
      else rate_limits.hit_count + 1
    end,
    window_start = case
      when rate_limits.window_start + make_interval(secs => p_window_seconds) <= now() then now()
      else rate_limits.window_start
    end
  returning hit_count into v_count;

  return v_count <= p_max_hits;
end;
$$;

create or replace function public.apply_player_answer_score(
  p_player_id uuid,
  p_points integer,
  p_is_correct boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.players
  set
    total_score = total_score + greatest(0, p_points),
    streak = case
      when p_is_correct is true then streak + 1
      when p_is_correct is false then 0
      else streak
    end,
    last_seen_at = now()
  where id = p_player_id;
end;
$$;

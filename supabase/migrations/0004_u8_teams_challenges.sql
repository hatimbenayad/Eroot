-- Eroot U8 Teams & Self-Paced Challenges

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0 and char_length(name) <= 40),
  color_hex text not null,
  position integer not null check (position >= 0 and position < 5)
);

create index if not exists teams_game_idx on public.teams (game_id, position);

alter table public.teams enable row level security;

create policy "teams_host_all"
  on public.teams for all
  to authenticated
  using (
    exists (
      select 1 from public.games g
      where g.id = teams.game_id and g.host_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.games g
      where g.id = teams.game_id and g.host_id = auth.uid()
    )
  );

alter table public.players
  add column if not exists team_id uuid references public.teams(id) on delete set null;

create index if not exists players_team_idx on public.players (team_id);

alter table public.games
  add column if not exists challenge_deadline timestamptz,
  add column if not exists challenge_timer_enabled boolean not null default true,
  add column if not exists challenge_accuracy_only boolean not null default false;


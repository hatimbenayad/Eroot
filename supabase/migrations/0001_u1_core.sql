-- Eroot U1 Core Schema: profiles, quizzes, slides, media_assets, RLS & Storage

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  preferred_locale text not null default 'en' check (preferred_locale in ('en', 'es')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. Quizzes
-- ---------------------------------------------------------------------------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  visibility text not null default 'private' check (visibility in ('private', 'link', 'public')),
  theme_id text not null default 'indigo-stage',
  cover_image_url text,
  language text not null default 'en',
  music_preset text not null default 'chill-pulse',
  is_valid boolean not null default false,
  is_published boolean not null default false,
  tags text[] not null default '{}',
  subject text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quizzes_owner_updated_idx
  on public.quizzes (owner_id, updated_at desc);

create index if not exists quizzes_public_discover_idx
  on public.quizzes (visibility, is_published, updated_at desc);

drop trigger if exists quizzes_set_updated_at on public.quizzes;
create trigger quizzes_set_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();

alter table public.quizzes enable row level security;

create policy "quizzes_owner_all"
  on public.quizzes for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "quizzes_public_read"
  on public.quizzes for select
  to anon, authenticated
  using (visibility = 'public' and is_published = true);

-- ---------------------------------------------------------------------------
-- 3. Slides
-- ---------------------------------------------------------------------------
create table if not exists public.slides (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  position integer not null check (position >= 0),
  type text not null,
  title text not null default '',
  media_url text,
  media_reveal boolean not null default false,
  time_limit integer not null default 20 check (time_limit in (5, 10, 20, 30, 60, 90, 120, 240)),
  points_mode text not null default 'standard' check (points_mode in ('standard', 'double', 'none')),
  select_mode text not null default 'single' check (select_mode in ('single', 'multi')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists slides_quiz_position_idx
  on public.slides (quiz_id, position);

drop trigger if exists slides_set_updated_at on public.slides;
create trigger slides_set_updated_at
  before update on public.slides
  for each row execute function public.set_updated_at();

alter table public.slides enable row level security;

create policy "slides_owner_all"
  on public.slides for all
  to authenticated
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = slides.quiz_id and q.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.quizzes q
      where q.id = slides.quiz_id and q.owner_id = auth.uid()
    )
  );

create policy "slides_public_read"
  on public.slides for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = slides.quiz_id
        and q.visibility = 'public'
        and q.is_published = true
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Media Assets & Storage Bucket
-- ---------------------------------------------------------------------------
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now()
);

create index if not exists media_assets_owner_idx
  on public.media_assets (owner_id, created_at desc);

alter table public.media_assets enable row level security;

create policy "media_assets_owner_all"
  on public.media_assets for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quiz-media',
  'quiz-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "quiz_media_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'quiz-media');

create policy "quiz_media_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'quiz-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "quiz_media_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'quiz-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "quiz_media_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'quiz-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


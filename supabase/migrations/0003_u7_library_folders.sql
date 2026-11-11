-- Eroot U7 Library Folders, Favourites & Link-Shared Quiz RPC

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0 and char_length(name) <= 60),
  created_at timestamptz not null default now()
);

create index if not exists folders_owner_idx on public.folders (owner_id, name);

alter table public.folders enable row level security;

create policy "folders_owner_all"
  on public.folders for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

alter table public.quizzes
  add column if not exists folder_id uuid references public.folders(id) on delete set null,
  add column if not exists is_favourite boolean not null default false;

create index if not exists quizzes_folder_idx on public.quizzes (owner_id, folder_id);

-- Security-definer helper for link-shared quizzes so anon cannot enumerate private/link lists
create or replace function public.get_shared_quiz(p_quiz_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quiz public.quizzes%rowtype;
  v_slides jsonb;
begin
  select * into v_quiz
  from public.quizzes
  where id = p_quiz_id
    and is_published = true
    and visibility in ('public', 'link');

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(s order by s.position asc), '[]'::jsonb)
  into v_slides
  from public.slides s
  where s.quiz_id = v_quiz.id;

  return jsonb_build_object(
    'quiz', to_jsonb(v_quiz),
    'slides', v_slides
  );
end;
$$;


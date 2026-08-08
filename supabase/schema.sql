-- Doosri Nazar schema. Run once in the Supabase SQL editor.

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  description text not null,
  status text not null default 'pending'
    check (status in ('pending', 'generating', 'walking', 'done', 'error')),
  created_at timestamptz not null default now()
);

create table public.screens (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs (id) on delete cascade,
  position int not null,
  storage_path text not null,
  width int not null default 0,
  height int not null default 0,
  bytes int not null default 0,
  label text not null default ''
);

create table public.personas (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs (id) on delete cascade,
  name text not null,
  age int not null,
  language text not null,
  device text not null,
  connection text not null, -- "5G" | "4G" | "Weak 4G" | "Throttled" (kept as free text so labels can evolve)
  context text not null,
  initials text not null,
  outcome text check (outcome in ('completed', 'struggled', 'dropped')),
  dropped_at_screen int
);

create table public.steps (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas (id) on delete cascade,
  screen_id uuid not null references public.screens (id) on delete cascade,
  position int not null,
  status text not null check (status in ('ok', 'friction', 'dropped')),
  narrative text not null,
  suggestion text,
  metrics jsonb not null default '{}'
);

alter table public.runs enable row level security;
alter table public.screens enable row level security;
alter table public.personas enable row level security;
alter table public.steps enable row level security;

create policy "own runs" on public.runs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own screens" on public.screens
  for all using (
    exists (select 1 from public.runs r where r.id = run_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.runs r where r.id = run_id and r.user_id = auth.uid())
  );

create policy "own personas" on public.personas
  for all using (
    exists (select 1 from public.runs r where r.id = run_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.runs r where r.id = run_id and r.user_id = auth.uid())
  );

create policy "own steps" on public.steps
  for all using (
    exists (
      select 1 from public.personas p
      join public.runs r on r.id = p.run_id
      where p.id = persona_id and r.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.personas p
      join public.runs r on r.id = p.run_id
      where p.id = persona_id and r.user_id = auth.uid()
    )
  );

-- Private bucket for uploaded screenshots; paths are {user_id}/{run_id}/{file}.
insert into storage.buckets (id, name, public) values ('screens', 'screens', false);

create policy "own screen objects" on storage.objects
  for all using (
    bucket_id = 'screens' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'screens' and (storage.foldername(name))[1] = auth.uid()::text
  );

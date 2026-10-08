create table if not exists public.user_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  module_id text not null,
  title text not null check (char_length(title) between 1 and 120),
  live_url text check (live_url is null or live_url ~* '^https?://'),
  github_url text check (github_url is null or github_url ~* '^https?://'),
  description text check (description is null or char_length(description) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_projects_module_created_idx
  on public.user_projects (module_id, created_at desc);

alter table public.user_projects enable row level security;

grant select, insert, update, delete on public.user_projects to authenticated;

drop policy if exists "Authenticated users can view projects"
  on public.user_projects;
create policy "Authenticated users can view projects"
on public.user_projects for select to authenticated
using (true);

drop policy if exists "Users can add own projects"
  on public.user_projects;
create policy "Users can add own projects"
on public.user_projects for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own projects"
  on public.user_projects;
create policy "Users can update own projects"
on public.user_projects for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own projects"
  on public.user_projects;
create policy "Users can delete own projects"
on public.user_projects for delete to authenticated
using ((select auth.uid()) = user_id);
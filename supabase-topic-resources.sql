create table if not exists public.topic_resources (
  id uuid primary key default gen_random_uuid(),
  topic_id text not null,
  title text not null check (char_length(title) between 1 and 120),
  url text not null check (url ~* '^https?://'),
  resource_type text not null check (
    resource_type in ('video', 'document', 'article', 'course', 'other')
  ),
  description text check (description is null or char_length(description) <= 500),
  added_by uuid not null references auth.users(id) on delete cascade,
  added_by_name text not null default 'Learner',
  created_at timestamptz not null default now()
);

alter table public.topic_resources
  add column if not exists added_by_name text not null default 'Learner';

update public.topic_resources as resource
set added_by_name = coalesce(
  nullif(auth_user.raw_user_meta_data ->> 'display_name', ''),
  nullif(split_part(auth_user.email, '@', 1), ''),
  'Learner'
)
from auth.users as auth_user
where resource.added_by = auth_user.id
  and resource.added_by_name = 'Learner';

create index if not exists topic_resources_topic_created_idx
  on public.topic_resources (topic_id, created_at desc);

alter table public.topic_resources enable row level security;

grant select, insert, update, delete on public.topic_resources to authenticated;

drop policy if exists "Authenticated users can view topic resources"
  on public.topic_resources;
create policy "Authenticated users can view topic resources"
on public.topic_resources for select to authenticated
using (true);

drop policy if exists "Users can add own topic resources"
  on public.topic_resources;
create policy "Users can add own topic resources"
on public.topic_resources for insert to authenticated
with check ((select auth.uid()) = added_by);

drop policy if exists "Users can update own topic resources"
  on public.topic_resources;
create policy "Users can update own topic resources"
on public.topic_resources for update to authenticated
using ((select auth.uid()) = added_by)
with check ((select auth.uid()) = added_by);

drop policy if exists "Users can delete own topic resources"
  on public.topic_resources;
create policy "Users can delete own topic resources"
on public.topic_resources for delete to authenticated
using ((select auth.uid()) = added_by);
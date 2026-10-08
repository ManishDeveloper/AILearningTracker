create table if not exists public.user_leaderboard (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  completed_topics integer not null default 0 check (completed_topics >= 0),
  completed_projects integer not null default 0,
  achievements_unlocked integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_leaderboard
  add column if not exists completed_topics integer not null default 0;

update public.user_leaderboard as leaderboard
set completed_topics = coalesce((
  select count(distinct topic.topic_id)::integer
  from public.user_progress as progress
  cross join lateral jsonb_array_elements_text(
    coalesce(to_jsonb(progress.completed_topics), '[]'::jsonb)
  ) as topic(topic_id)
  where progress.user_id = leaderboard.user_id
), 0);

alter table public.user_leaderboard enable row level security;

drop policy if exists "Authenticated users can view leaderboard" on public.user_leaderboard;
create policy "Authenticated users can view leaderboard"
on public.user_leaderboard for select to authenticated
using (true);

drop policy if exists "Users can insert own leaderboard entry" on public.user_leaderboard;
create policy "Users can insert own leaderboard entry"
on public.user_leaderboard for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own leaderboard entry" on public.user_leaderboard;
create policy "Users can update own leaderboard entry"
on public.user_leaderboard for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
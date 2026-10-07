create table if not exists public.user_leaderboard (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  completed_projects integer not null default 0,
  achievements_unlocked integer not null default 0,
  updated_at timestamptz not null default now()
);

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
alter table public.user_progress enable row level security;
grant select on public.user_progress to authenticated;

drop policy if exists "Authenticated users can view group topic progress"
  on public.user_progress;
create policy "Authenticated users can view group topic progress"
on public.user_progress for select to authenticated
using (true);
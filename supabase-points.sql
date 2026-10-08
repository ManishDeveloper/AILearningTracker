create table if not exists public.user_points (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  points_total integer not null default 0 check (points_total >= 0),
  updated_at timestamptz not null default now()
);

alter table public.user_points enable row level security;
revoke all on public.user_points from anon, authenticated;
grant select on public.user_points to authenticated;

drop policy if exists "Authenticated users can view points"
  on public.user_points;
create policy "Authenticated users can view points"
on public.user_points for select to authenticated
using (true);

create or replace function public.apply_user_points(
  p_user_id uuid,
  p_delta integer,
  p_display_name text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  resolved_display_name text;
begin
  select coalesce(
    nullif(p_display_name, ''),
    nullif(auth_user.raw_user_meta_data ->> 'display_name', ''),
    nullif(split_part(auth_user.email, '@', 1), ''),
    'Learner'
  )
  into resolved_display_name
  from auth.users as auth_user
  where auth_user.id = p_user_id;

  if resolved_display_name is null then
    raise exception 'Unable to find the account for points update.';
  end if;

  insert into public.user_points (user_id, display_name, points_total)
  values (p_user_id, resolved_display_name, greatest(0, p_delta))
  on conflict (user_id) do update
  set points_total = greatest(0, public.user_points.points_total + p_delta),
      display_name = coalesce(nullif(p_display_name, ''), public.user_points.display_name),
      updated_at = now();
end;
$$;

revoke all on function public.apply_user_points(uuid, integer, text)
  from public, anon, authenticated;

create or replace function public.score_completed_topics()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  added_count integer := 0;
  removed_count integer := 0;
  point_delta integer;
begin
  if tg_op = 'INSERT' then
    select count(distinct topic_id)
    into added_count
    from jsonb_array_elements_text(
      coalesce(to_jsonb(new.completed_topics), '[]'::jsonb)
    ) as topics(topic_id);
  else
    select count(distinct new_topics.topic_id)
    into added_count
    from jsonb_array_elements_text(
      coalesce(to_jsonb(new.completed_topics), '[]'::jsonb)
    ) as new_topics(topic_id)
    where not exists (
      select 1
      from jsonb_array_elements_text(
        coalesce(to_jsonb(old.completed_topics), '[]'::jsonb)
      ) as old_topics(topic_id)
      where old_topics.topic_id = new_topics.topic_id
    );

    select count(distinct old_topics.topic_id)
    into removed_count
    from jsonb_array_elements_text(
      coalesce(to_jsonb(old.completed_topics), '[]'::jsonb)
    ) as old_topics(topic_id)
    where not exists (
      select 1
      from jsonb_array_elements_text(
        coalesce(to_jsonb(new.completed_topics), '[]'::jsonb)
      ) as new_topics(topic_id)
      where new_topics.topic_id = old_topics.topic_id
    );
  end if;

  point_delta := (added_count - removed_count) * 10;
  if point_delta <> 0 then
    perform public.apply_user_points(new.user_id, point_delta);
  end if;

  return new;
end;
$$;

drop trigger if exists score_completed_topics_after_change
  on public.user_progress;
create trigger score_completed_topics_after_change
after insert or update of completed_topics on public.user_progress
for each row execute function public.score_completed_topics();

create or replace function public.score_topic_resource_changes()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'INSERT' then
    perform public.apply_user_points(new.added_by, 20, new.added_by_name);
    return new;
  end if;

  perform public.apply_user_points(old.added_by, -20, old.added_by_name);
  return old;
end;
$$;

drop trigger if exists score_topic_resource_insert
  on public.topic_resources;
create trigger score_topic_resource_insert
after insert on public.topic_resources
for each row execute function public.score_topic_resource_changes();

drop trigger if exists score_topic_resource_delete
  on public.topic_resources;
create trigger score_topic_resource_delete
after delete on public.topic_resources
for each row execute function public.score_topic_resource_changes();

create or replace function public.score_project_changes()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'INSERT' then
    perform public.apply_user_points(new.user_id, 100, new.display_name);
    return new;
  end if;

  perform public.apply_user_points(old.user_id, -100, old.display_name);
  return old;
end;
$$;

drop trigger if exists score_project_insert on public.user_projects;
create trigger score_project_insert
after insert on public.user_projects
for each row execute function public.score_project_changes();

drop trigger if exists score_project_delete on public.user_projects;
create trigger score_project_delete
after delete on public.user_projects
for each row execute function public.score_project_changes();

with topic_points as (
  select
    progress.user_id,
    count(distinct topic.topic_id)::integer * 10 as points
  from public.user_progress as progress
  cross join lateral jsonb_array_elements_text(
    coalesce(to_jsonb(progress.completed_topics), '[]'::jsonb)
  ) as topic(topic_id)
  group by progress.user_id
), resource_points as (
  select added_by as user_id, count(*)::integer * 20 as points
  from public.topic_resources
  group by added_by
), project_points as (
  select user_id, count(*)::integer * 100 as points
  from public.user_projects
  group by user_id
)
insert into public.user_points (user_id, display_name, points_total)
select
  auth_user.id,
  coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'display_name', ''),
    nullif(split_part(auth_user.email, '@', 1), ''),
    'Learner'
  ),
  coalesce(topic_points.points, 0)
    + coalesce(resource_points.points, 0)
    + coalesce(project_points.points, 0)
from auth.users as auth_user
left join topic_points on topic_points.user_id = auth_user.id
left join resource_points on resource_points.user_id = auth_user.id
left join project_points on project_points.user_id = auth_user.id
on conflict (user_id) do update
set display_name = excluded.display_name,
    points_total = excluded.points_total,
    updated_at = now();
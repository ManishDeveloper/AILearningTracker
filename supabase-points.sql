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

create or replace function public.initialize_user_points()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  resolved_display_name text;
begin
  resolved_display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Learner'
  );

  insert into public.user_points (user_id, display_name, points_total)
  values (new.id, resolved_display_name, 0)
  on conflict (user_id) do update
  set display_name = excluded.display_name,
      updated_at = now();

  return new;
end;
$$;

revoke all on function public.initialize_user_points()
  from public, anon, authenticated;

drop trigger if exists initialize_user_points_after_signup on auth.users;
create trigger initialize_user_points_after_signup
after insert on auth.users
for each row execute function public.initialize_user_points();

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

create or replace function public.roadmap_topic_points(p_topic_id text)
returns integer
language sql
immutable
parallel safe
as $$
  select case p_topic_id
    when 'm1t1' then 10
    when 'm1t2' then 15
    when 'm1t3' then 10
    when 'm1t4' then 15
    when 'm1t5' then 15
    when 'm1t6' then 15
    when 'm1t7' then 20
    when 'm1t8' then 20
    when 'm1t9' then 150
    when 'm2t1' then 10
    when 'm2t2' then 10
    when 'm2t3' then 10
    when 'm2t4' then 15
    when 'm2t5' then 15
    when 'm2t6' then 20
    when 'm2t7' then 175
    when 'm2t8' then 15
    when 'm2t9' then 20
    when 'm2t10' then 20
    when 'm2t11' then 25
    when 'm2t12' then 30
    when 'm3t1' then 10
    when 'm3t2' then 25
    when 'm3t3' then 20
    when 'm3t4' then 30
    when 'm3t5' then 35
    when 'm3t6' then 20
    when 'm3t7' then 15
    when 'm3t8' then 25
    when 'm3t9' then 30
    when 'm3t10' then 30
    when 'm3t11' then 35
    when 'm3t12' then 30
    when 'm3t13' then 35
    when 'm3t14' then 35
    when 'm3t15' then 40
    when 'm3t16' then 35
    when 'm3t17' then 35
    when 'm3t18' then 30
    when 'm3t19' then 30
    when 'm3t20' then 150
    when 'm3t21' then 250
    when 'm4t1' then 15
    when 'm4t2' then 20
    when 'm4t3' then 30
    when 'm4t4' then 30
    when 'm4t5' then 35
    when 'm4t6' then 30
    when 'm4t7' then 35
    when 'm4t8' then 40
    when 'm4t9' then 35
    when 'm4t10' then 30
    when 'm4t11' then 35
    when 'm4t12' then 35
    when 'm4t13' then 35
    when 'm4t14' then 30
    when 'm4t15' then 25
    when 'm4t16' then 40
    when 'm4t17' then 250
    when 'm4t18' then 275
    when 'm4t19' then 300
    else 0
  end;
$$;

revoke all on function public.roadmap_topic_points(text)
  from public, anon, authenticated;

create or replace function public.score_completed_topics()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  added_points integer := 0;
  removed_points integer := 0;
  point_delta integer;
begin
  if tg_op = 'INSERT' then
    select coalesce(sum(public.roadmap_topic_points(topics.topic_id)), 0)::integer
    into added_points
    from (
      select distinct topic_id
      from jsonb_array_elements_text(
        coalesce(to_jsonb(new.completed_topics), '[]'::jsonb)
      ) as completed(topic_id)
    ) as topics;
  else
    select coalesce(sum(public.roadmap_topic_points(new_topics.topic_id)), 0)::integer
    into added_points
    from (
      select distinct topic_id
      from jsonb_array_elements_text(
        coalesce(to_jsonb(new.completed_topics), '[]'::jsonb)
      ) as completed(topic_id)
    ) as new_topics
    where not exists (
      select 1
      from jsonb_array_elements_text(
        coalesce(to_jsonb(old.completed_topics), '[]'::jsonb)
      ) as old_topics(topic_id)
      where old_topics.topic_id = new_topics.topic_id
    );

    select coalesce(sum(public.roadmap_topic_points(old_topics.topic_id)), 0)::integer
    into removed_points
    from (
      select distinct topic_id
      from jsonb_array_elements_text(
        coalesce(to_jsonb(old.completed_topics), '[]'::jsonb)
      ) as completed(topic_id)
    ) as old_topics
    where not exists (
      select 1
      from jsonb_array_elements_text(
        coalesce(to_jsonb(new.completed_topics), '[]'::jsonb)
      ) as new_topics(topic_id)
      where new_topics.topic_id = old_topics.topic_id
    );
  end if;

  point_delta := added_points - removed_points;
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
    perform public.apply_user_points(new.added_by, 50, new.added_by_name);
    return new;
  end if;

  perform public.apply_user_points(old.added_by, -50, old.added_by_name);
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

with completed_topic_points as (
  select
    completed.user_id,
    sum(public.roadmap_topic_points(completed.topic_id))::integer as points
  from (
    select distinct progress.user_id, topic.topic_id
    from public.user_progress as progress
    cross join lateral jsonb_array_elements_text(
      coalesce(to_jsonb(progress.completed_topics), '[]'::jsonb)
    ) as topic(topic_id)
  ) as completed
  group by completed.user_id
), resource_points as (
  select added_by as user_id, count(*)::integer * 50 as points
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
  coalesce(completed_topic_points.points, 0)
    + coalesce(resource_points.points, 0)
    + coalesce(project_points.points, 0)
from auth.users as auth_user
left join completed_topic_points
  on completed_topic_points.user_id = auth_user.id
left join resource_points on resource_points.user_id = auth_user.id
left join project_points on project_points.user_id = auth_user.id
on conflict (user_id) do update
set display_name = excluded.display_name,
    points_total = excluded.points_total,
    updated_at = now();
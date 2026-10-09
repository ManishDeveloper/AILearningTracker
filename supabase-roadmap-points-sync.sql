begin;

alter table public.user_points enable row level security;
revoke all on public.user_points from anon, authenticated;
grant select on public.user_points to authenticated;

drop policy if exists "Authenticated users can view points"
  on public.user_points;
create policy "Authenticated users can view points"
on public.user_points for select to authenticated
using (true);

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

commit;

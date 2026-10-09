-- Run once to raise the resource reward from 20 to 50 points.
begin;

with resource_deltas as (
  select
    added_by as user_id,
    count(*)::integer * 30 as points_delta
  from public.topic_resources
  group by added_by
)
update public.user_points as points
set points_total = greatest(0, points.points_total + resource_deltas.points_delta),
    updated_at = now()
from resource_deltas
where points.user_id = resource_deltas.user_id;

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

commit;
alter table public.user_progress
  add column if not exists topic_details jsonb not null default '{}'::jsonb;

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  event_type text not null check (
    event_type in ('topic_started', 'topic_completed', 'project_added', 'resource_added')
  ),
  topic_id text,
  subject text not null,
  created_at timestamptz not null default now()
);

alter table public.activity_events
  add column if not exists entity_id uuid,
  add column if not exists target_url text;

create index if not exists activity_events_created_idx
  on public.activity_events (created_at desc);

alter table public.activity_events enable row level security;
revoke all on public.activity_events from anon, authenticated;
grant select on public.activity_events to authenticated;

drop policy if exists "Authenticated users can view activity"
  on public.activity_events;
create policy "Authenticated users can view activity"
on public.activity_events for select to authenticated
using (true);

create table if not exists public.activity_reads (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.activity_reads enable row level security;
revoke all on public.activity_reads from anon, authenticated;
grant select, insert, update on public.activity_reads to authenticated;

drop policy if exists "Users can view own activity read state"
  on public.activity_reads;
create policy "Users can view own activity read state"
on public.activity_reads for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own activity read state"
  on public.activity_reads;
create policy "Users can insert own activity read state"
on public.activity_reads for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own activity read state"
  on public.activity_reads;
create policy "Users can update own activity read state"
on public.activity_reads for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create table if not exists public.activity_reactions (
  activity_id uuid not null references public.activity_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

alter table public.activity_reactions enable row level security;
revoke all on public.activity_reactions from anon, authenticated;
grant select, insert, delete on public.activity_reactions to authenticated;

drop policy if exists "Authenticated users can view activity reactions"
  on public.activity_reactions;
create policy "Authenticated users can view activity reactions"
on public.activity_reactions for select to authenticated
using (true);

drop policy if exists "Users can add own activity reactions"
  on public.activity_reactions;
create policy "Users can add own activity reactions"
on public.activity_reactions for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove own activity reactions"
  on public.activity_reactions;
create policy "Users can remove own activity reactions"
on public.activity_reactions for delete to authenticated
using ((select auth.uid()) = user_id);

update public.activity_events as event
set
  entity_id = coalesce(event.entity_id, (
    select project.id
    from public.user_projects as project
    where event.event_type = 'project_added'
      and project.user_id = event.user_id
      and project.title = event.subject
    order by abs(extract(epoch from (project.created_at - event.created_at)))
    limit 1
  )),
  target_url = coalesce(event.target_url, (
    select coalesce(project.live_url, project.github_url)
    from public.user_projects as project
    where event.event_type = 'project_added'
      and project.user_id = event.user_id
      and project.title = event.subject
    order by abs(extract(epoch from (project.created_at - event.created_at)))
    limit 1
  ))
where event.event_type = 'project_added'
  and (event.entity_id is null or event.target_url is null);

update public.activity_events as event
set
  entity_id = coalesce(event.entity_id, (
    select resource.id
    from public.topic_resources as resource
    where event.event_type = 'resource_added'
      and resource.added_by = event.user_id
      and resource.topic_id = event.topic_id
      and resource.title = event.subject
    order by abs(extract(epoch from (resource.created_at - event.created_at)))
    limit 1
  )),
  target_url = coalesce(event.target_url, (
    select resource.url
    from public.topic_resources as resource
    where event.event_type = 'resource_added'
      and resource.added_by = event.user_id
      and resource.topic_id = event.topic_id
      and resource.title = event.subject
    order by abs(extract(epoch from (resource.created_at - event.created_at)))
    limit 1
  ))
where event.event_type = 'resource_added'
  and (event.entity_id is null or event.target_url is null);

create or replace function public.record_topic_activity_event()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  previous_details jsonb := '{}'::jsonb;
  previous_completed jsonb := '[]'::jsonb;
  topic_entry record;
  previous_status text;
  activity_display_name text;
begin
  if tg_op = 'UPDATE' then
    previous_details := coalesce(to_jsonb(old.topic_details), '{}'::jsonb);
    previous_completed := coalesce(to_jsonb(old.completed_topics), '[]'::jsonb);
  end if;

  select coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'display_name', ''),
    nullif(split_part(auth_user.email, '@', 1), ''),
    'Learner'
  )
  into activity_display_name
  from auth.users as auth_user
  where auth_user.id = new.user_id;

  for topic_entry in
    select key, value
    from jsonb_each(coalesce(to_jsonb(new.topic_details), '{}'::jsonb))
  loop
    previous_status := coalesce(
      previous_details -> topic_entry.key ->> 'status',
      case
        when previous_completed @> to_jsonb(topic_entry.key) then 'complete'
        else 'not_started'
      end
    );

    if topic_entry.value ->> 'status' = 'in_progress'
      and previous_status <> 'in_progress' then
      insert into public.activity_events (
        user_id, display_name, event_type, topic_id, subject
      ) values (
        new.user_id, coalesce(activity_display_name, 'Learner'),
        'topic_started', topic_entry.key, topic_entry.key
      );
    elsif topic_entry.value ->> 'status' = 'complete'
      and previous_status <> 'complete' then
      insert into public.activity_events (
        user_id, display_name, event_type, topic_id, subject
      ) values (
        new.user_id, coalesce(activity_display_name, 'Learner'),
        'topic_completed', topic_entry.key, topic_entry.key
      );
    end if;
  end loop;

  return new;
end;
$$;

revoke all on function public.record_topic_activity_event()
  from public, anon, authenticated;

drop trigger if exists record_topic_activity_after_change
  on public.user_progress;
create trigger record_topic_activity_after_change
after insert or update of topic_details on public.user_progress
for each row execute function public.record_topic_activity_event();

create or replace function public.record_project_activity_event()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  activity_display_name text;
begin
  select coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'display_name', ''),
    nullif(split_part(auth_user.email, '@', 1), ''),
    'Learner'
  )
  into activity_display_name
  from auth.users as auth_user
  where auth_user.id = new.user_id;

  insert into public.activity_events (
    user_id, display_name, event_type, subject, entity_id, target_url
  ) values (
    new.user_id, coalesce(activity_display_name, 'Learner'),
    'project_added', new.title, new.id, coalesce(new.live_url, new.github_url)
  );

  return new;
end;
$$;

revoke all on function public.record_project_activity_event()
  from public, anon, authenticated;

drop trigger if exists record_project_activity_after_insert
  on public.user_projects;
create trigger record_project_activity_after_insert
after insert on public.user_projects
for each row execute function public.record_project_activity_event();

create or replace function public.record_resource_activity_event()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  activity_display_name text;
begin
  select coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'display_name', ''),
    nullif(split_part(auth_user.email, '@', 1), ''),
    'Learner'
  )
  into activity_display_name
  from auth.users as auth_user
  where auth_user.id = new.added_by;

  insert into public.activity_events (
    user_id, display_name, event_type, topic_id, subject, entity_id, target_url
  ) values (
    new.added_by, coalesce(activity_display_name, 'Learner'),
    'resource_added', new.topic_id, new.title, new.id, new.url
  );

  return new;
end;
$$;

revoke all on function public.record_resource_activity_event()
  from public, anon, authenticated;

drop trigger if exists record_resource_activity_after_insert
  on public.topic_resources;
create trigger record_resource_activity_after_insert
after insert on public.topic_resources
for each row execute function public.record_resource_activity_event();
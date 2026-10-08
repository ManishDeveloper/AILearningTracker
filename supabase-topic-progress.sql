alter table public.user_progress
  add column if not exists topic_details jsonb not null default '{}'::jsonb;
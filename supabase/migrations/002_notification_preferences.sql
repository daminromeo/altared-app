-- Add notification_preferences JSONB column to profiles
alter table public.profiles
  add column if not exists notification_preferences jsonb
  default '{"weekly_summary": true, "task_reminders": true}'::jsonb;

-- Backfill existing profiles with default preferences
update public.profiles
  set notification_preferences = '{"weekly_summary": true, "task_reminders": true}'::jsonb
  where notification_preferences is null;

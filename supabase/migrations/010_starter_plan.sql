-- Starter plan: the dashboard adds a standard planning timeline as ordinary
-- tasks (reminders) when a couple first arrives. plan_key marks which timeline
-- step a task came from, so the plan can be cleared or moved when the wedding
-- date changes. plan_due_date is the date the plan gave it; when due_date no
-- longer matches, the couple has edited it and it stays put.

ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS plan_key text;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS plan_due_date timestamptz;

-- One task per timeline step per couple, so adding the plan twice is harmless.
-- NULLs are distinct, so ordinary tasks are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS reminders_user_plan_key
  ON public.reminders (user_id, plan_key);

-- Set the first time the plan is added (or offered and cleared), so it is
-- only ever added automatically once.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS starter_plan_at timestamptz;

COMMENT ON COLUMN public.reminders.plan_key IS
  'Starter plan step this task came from (e.g. book-venue). Null for tasks the couple created.';
COMMENT ON COLUMN public.reminders.plan_due_date IS
  'Due date the starter plan assigned. Differs from due_date once the couple edits it.';
COMMENT ON COLUMN public.profiles.starter_plan_at IS
  'When the starter plan was first added to this account. Null means never.';

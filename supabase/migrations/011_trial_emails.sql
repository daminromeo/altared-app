-- Trial-ending emails (day 10 and day 13) are sent by a daily cron. This
-- records which ones an account has had, so a retried or doubled run never
-- sends the same email twice.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_emails_sent text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.profiles.trial_emails_sent IS
  'Trial-ending emails already sent to this account, e.g. {day10,day13}.';

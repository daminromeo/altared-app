-- Text-a-planner: couples text their planner through hello. The planner also
-- checks in on its own ("did you finish that task?"), so it needs to know
-- where to text each couple, when they last talked, and which check-ins it
-- has already sent.

-- Set from the first inbound text. hello sends by phone number; the account
-- link itself lives in hello (external_user_id), never matched on phone.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS text_phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS text_conversation_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS text_last_inbound_at timestamptz;

-- 'text' for tasks the couple added by texting, so a check-in can say
-- "that task you added the other day". Null for tasks added in the app.
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS created_via text;

-- One row per check-in sent. subject_key names what it was about (e.g.
-- task:<id>, vendor:<id>, category:Florist) so the same thing is never
-- brought up twice.
CREATE TABLE IF NOT EXISTS public.text_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_key text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS text_checkins_user_subject
  ON public.text_checkins (user_id, subject_key);
CREATE INDEX IF NOT EXISTS text_checkins_user_sent
  ON public.text_checkins (user_id, sent_at DESC);

-- Written only by the server (service role); couples can read their own.
ALTER TABLE public.text_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own text check-ins"
  ON public.text_checkins FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON COLUMN public.profiles.text_phone IS
  'Phone the couple texts their planner from (via hello). Null until they connect.';
COMMENT ON COLUMN public.profiles.text_conversation_id IS
  'hello conversation id, so check-ins can read what was said recently.';
COMMENT ON COLUMN public.profiles.text_last_inbound_at IS
  'When the couple last texted their planner.';
COMMENT ON COLUMN public.reminders.created_via IS
  'text when the couple added this task by texting their planner; null otherwise.';
COMMENT ON TABLE public.text_checkins IS
  'Check-in texts the planner sent on its own, one per subject per couple.';

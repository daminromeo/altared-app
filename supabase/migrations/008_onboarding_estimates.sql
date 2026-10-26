-- Onboarding step 1 now accepts an approximate date ("Spring '27") instead of
-- requiring an exact one, and step 3's vendor categories are now kept.
-- wedding_date stays the source of truth when the couple knows the exact day.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wedding_date_estimate text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS planned_categories text[];

COMMENT ON COLUMN public.profiles.wedding_date_estimate IS
  'Approximate wedding timing from onboarding, e.g. 2027-spring or later. Null when wedding_date is set or unknown.';
COMMENT ON COLUMN public.profiles.planned_categories IS
  'Vendor category ids picked during onboarding (venue, photographer, ...).';

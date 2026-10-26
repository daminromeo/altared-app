-- Wedding Pass: a one-time purchase replaces the Pro/Premium monthly plans.
-- New accounts get the paid features free for 14 days (computed in the app
-- from profiles.created_at, so the trial needs no column of its own).
--
-- Existing pro/premium subscribers keep their subscription_status and full
-- access until they cancel.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pass_expires_at timestamptz;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('free', 'pro', 'premium', 'pass'));

-- ── Billing columns are server-only ─────────────────────────────────────────
-- "Users can update own profile" covers every column, so until now a signed-in
-- user could set their own subscription_status from the browser. Requests made
-- with a user's JWT (roles anon/authenticated) now leave billing fields and
-- created_at (which starts the trial) unchanged. The Stripe webhook uses the
-- service role, and the SQL editor has no JWT, so both can still change them.

CREATE OR REPLACE FUNCTION public.protect_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') IN ('anon', 'authenticated') THEN
    NEW.subscription_status := OLD.subscription_status;
    NEW.subscription_id := OLD.subscription_id;
    NEW.stripe_customer_id := OLD.stripe_customer_id;
    NEW.pass_expires_at := OLD.pass_expires_at;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_billing_columns ON public.profiles;
CREATE TRIGGER protect_billing_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_billing_columns();

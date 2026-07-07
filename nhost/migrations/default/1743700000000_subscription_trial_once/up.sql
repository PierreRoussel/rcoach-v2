-- One free Premium trial per account.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_consumed_at TIMESTAMPTZ;

UPDATE public.subscriptions
SET trial_consumed_at = COALESCE(updated_at, created_at, now())
WHERE status = 'trialing'
  AND trial_consumed_at IS NULL;

CREATE OR REPLACE FUNCTION public.sync_profile_premium_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.trial_consumed_at IS NOT NULL AND NEW.trial_consumed_at IS NULL THEN
    NEW.trial_consumed_at = OLD.trial_consumed_at;
  END IF;

  IF NEW.status = 'trialing' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'trialing') THEN
    IF TG_OP = 'UPDATE' AND OLD.trial_consumed_at IS NOT NULL THEN
      RAISE EXCEPTION 'trial_already_consumed'
        USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.trial_consumed_at IS NULL THEN
      NEW.trial_consumed_at = now();
    END IF;
  END IF;

  UPDATE public.profiles
  SET is_premium = (NEW.tier = 'premium' AND NEW.status IN ('active', 'trialing'))
  WHERE id = NEW.user_id;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_premium_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET is_premium = (NEW.tier = 'premium' AND NEW.status IN ('active', 'trialing'))
  WHERE id = NEW.user_id;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS trial_consumed_at;

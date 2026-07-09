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

DROP FUNCTION IF EXISTS public.reconcile_my_subscription();
DROP FUNCTION IF EXISTS public.subscription_is_premium_active(TEXT, TEXT, TIMESTAMPTZ);

UPDATE public.profiles AS p
SET is_premium = EXISTS (
  SELECT 1
  FROM public.subscriptions AS s
  WHERE s.user_id = p.id
    AND s.tier = 'premium'
    AND s.status IN ('active', 'trialing')
);

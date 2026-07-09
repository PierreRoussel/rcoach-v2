CREATE OR REPLACE FUNCTION public.subscription_is_premium_active(
  p_tier TEXT,
  p_status TEXT,
  p_current_period_end TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    p_tier = 'premium'
    AND p_status IN ('active', 'trialing')
    AND (
      p_current_period_end IS NULL
      OR p_current_period_end > now()
    );
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_premium_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET is_premium = public.subscription_is_premium_active(
    NEW.tier,
    NEW.status,
    NEW.current_period_end
  )
  WHERE id = NEW.user_id;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reconcile_my_subscription()
RETURNS SETOF public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := (NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'x-hasura-user-id')::uuid;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.subscriptions AS s
  SET
    tier = 'free',
    status = 'canceled',
    billing_period = NULL,
    current_period_end = NULL,
    provider = 'none',
    provider_ref = NULL,
    updated_at = now()
  WHERE s.user_id = uid
    AND s.status = 'trialing'
    AND s.current_period_end IS NOT NULL
    AND s.current_period_end <= now();

  RETURN QUERY
  SELECT *
  FROM public.subscriptions
  WHERE user_id = uid
  LIMIT 1;
END;
$$;

UPDATE public.profiles AS p
SET is_premium = public.subscription_is_premium_active(s.tier, s.status, s.current_period_end)
FROM public.subscriptions AS s
WHERE s.user_id = p.id;

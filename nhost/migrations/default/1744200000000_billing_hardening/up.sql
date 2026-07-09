-- Billing: server-side subscription updates + guard against client-side premium forgery.

CREATE OR REPLACE FUNCTION public.apply_billing_subscription(
  p_user_id UUID,
  p_tier TEXT,
  p_status TEXT,
  p_billing_period TEXT,
  p_current_period_end TIMESTAMPTZ,
  p_provider TEXT,
  p_provider_ref TEXT
)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.subscriptions;
BEGIN
  PERFORM set_config('rcoach.billing_sync', '1', true);

  INSERT INTO public.subscriptions (
    user_id,
    tier,
    status,
    billing_period,
    current_period_end,
    provider,
    provider_ref
  )
  VALUES (
    p_user_id,
    p_tier,
    p_status,
    p_billing_period,
    p_current_period_end,
    p_provider,
    p_provider_ref
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    tier = EXCLUDED.tier,
    status = EXCLUDED.status,
    billing_period = EXCLUDED.billing_period,
    current_period_end = EXCLUDED.current_period_end,
    provider = EXCLUDED.provider,
    provider_ref = EXCLUDED.provider_ref,
    updated_at = now();

  SELECT * INTO result
  FROM public.subscriptions
  WHERE user_id = p_user_id
  LIMIT 1;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_my_premium_trial(p_billing_period TEXT)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  existing public.subscriptions;
  trial_end timestamptz;
  result public.subscriptions;
BEGIN
  uid := (NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'x-hasura-user-id')::uuid;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_billing_period IS NULL OR p_billing_period NOT IN ('monthly', 'annual') THEN
    RAISE EXCEPTION 'invalid_billing_period';
  END IF;

  SELECT * INTO existing
  FROM public.subscriptions
  WHERE user_id = uid
  LIMIT 1;

  IF existing.id IS NOT NULL THEN
    IF public.subscription_is_premium_active(existing.tier, existing.status, existing.current_period_end) THEN
      RAISE EXCEPTION 'premium_already_active';
    END IF;

    IF existing.trial_consumed_at IS NOT NULL THEN
      RAISE EXCEPTION 'trial_already_consumed'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  trial_end := now() + interval '7 days';

  INSERT INTO public.subscriptions (
    user_id,
    tier,
    status,
    billing_period,
    current_period_end,
    provider,
    provider_ref,
    trial_consumed_at
  )
  VALUES (
    uid,
    'premium',
    'trialing',
    p_billing_period,
    trial_end,
    'none',
    NULL,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    tier = 'premium',
    status = 'trialing',
    billing_period = EXCLUDED.billing_period,
    current_period_end = EXCLUDED.current_period_end,
    provider = 'none',
    provider_ref = NULL,
    trial_consumed_at = COALESCE(public.subscriptions.trial_consumed_at, now()),
    updated_at = now();

  SELECT * INTO result
  FROM public.subscriptions
  WHERE user_id = uid
  LIMIT 1;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_my_subscription()
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  existing public.subscriptions;
  result public.subscriptions;
BEGIN
  uid := (NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'x-hasura-user-id')::uuid;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO existing
  FROM public.subscriptions
  WHERE user_id = uid
  LIMIT 1;

  IF existing.id IS NULL THEN
    RAISE EXCEPTION 'subscription_not_found';
  END IF;

  IF existing.provider IN ('play', 'stripe') AND existing.status IN ('active', 'past_due', 'trialing') THEN
    RAISE EXCEPTION 'managed_by_billing_provider';
  END IF;

  UPDATE public.subscriptions
  SET
    tier = 'free',
    status = 'canceled',
    billing_period = NULL,
    current_period_end = NULL,
    provider = 'none',
    provider_ref = NULL,
    updated_at = now()
  WHERE user_id = uid;

  SELECT * INTO result
  FROM public.subscriptions
  WHERE user_id = uid
  LIMIT 1;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_subscription_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('rcoach.billing_sync', true) = '1' THEN
    RETURN NEW;
  END IF;

  IF NEW.provider IN ('play', 'stripe')
    AND (TG_OP = 'INSERT' OR OLD.provider IS DISTINCT FROM NEW.provider) THEN
    RAISE EXCEPTION 'billing_provider_readonly'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.tier = 'premium'
    AND NEW.status IN ('active', 'past_due')
    AND COALESCE(NEW.provider, 'none') = 'none'
    AND (
      TG_OP = 'INSERT'
      OR OLD.tier IS DISTINCT FROM NEW.tier
      OR OLD.status IS DISTINCT FROM NEW.status
      OR OLD.provider IS DISTINCT FROM NEW.provider
    ) THEN
    RAISE EXCEPTION 'billing_required'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_guard_user_update ON public.subscriptions;

CREATE TRIGGER subscriptions_guard_user_update
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_subscription_user_update();

DROP TRIGGER IF EXISTS subscriptions_guard_user_update ON public.subscriptions;
DROP FUNCTION IF EXISTS public.guard_subscription_user_update();
DROP FUNCTION IF EXISTS public.cancel_my_subscription();
DROP FUNCTION IF EXISTS public.start_my_premium_trial(TEXT);
DROP FUNCTION IF EXISTS public.apply_billing_subscription(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT);

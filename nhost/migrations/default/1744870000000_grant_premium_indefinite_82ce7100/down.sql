UPDATE public.subscriptions
SET
  tier = 'free',
  status = 'active',
  billing_period = NULL,
  current_period_end = NULL,
  provider = 'none',
  provider_ref = NULL,
  updated_at = now()
WHERE user_id = '82ce7100-c48a-486a-944e-711547395f43';

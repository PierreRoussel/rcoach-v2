-- Grant indefinite Premium to a specific account (manual grant, no billing provider).
INSERT INTO public.subscriptions (
  user_id,
  tier,
  status,
  billing_period,
  current_period_end,
  provider,
  provider_ref,
  updated_at
)
VALUES (
  '82ce7100-c48a-486a-944e-711547395f43',
  'premium',
  'active',
  NULL,
  NULL,
  'none',
  NULL,
  now()
)
ON CONFLICT (user_id) DO UPDATE
SET
  tier = 'premium',
  status = 'active',
  billing_period = NULL,
  current_period_end = NULL,
  provider = 'none',
  provider_ref = NULL,
  updated_at = now();

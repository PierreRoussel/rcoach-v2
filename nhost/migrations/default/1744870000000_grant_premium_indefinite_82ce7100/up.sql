-- Bypass guard_subscription_user_update via apply_billing_subscription (sets rcoach.billing_sync).
SELECT public.apply_billing_subscription(
  '82ce7100-c48a-486a-944e-711547395f43'::uuid,
  'premium',
  'active',
  NULL,
  NULL,
  'none',
  'manual_indefinite_grant'
);

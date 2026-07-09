DROP FUNCTION IF EXISTS public.delete_my_account();
DROP FUNCTION IF EXISTS public.record_legal_consent();

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS privacy_accepted_at,
  DROP COLUMN IF EXISTS terms_accepted_at;

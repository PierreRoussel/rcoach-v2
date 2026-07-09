-- Block self-assignment of admin; onboarding completion is one-way (NULL -> timestamp).
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.role = 'admin')
    OR (
      TG_OP = 'UPDATE'
      AND NEW.role = 'admin'
      AND OLD.role IS DISTINCT FROM 'admin'
    ) THEN
    RAISE EXCEPTION 'Cannot assign admin role';
  END IF;

  IF TG_OP = 'UPDATE'
    AND NEW.onboarding_completed_at IS DISTINCT FROM OLD.onboarding_completed_at THEN
    IF OLD.onboarding_completed_at IS NOT NULL THEN
      RAISE EXCEPTION 'onboarding_completed_at cannot be changed once set';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_sensitive_fields ON public.profiles;

CREATE TRIGGER profiles_protect_sensitive_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_fields();

CREATE OR REPLACE FUNCTION public.complete_my_onboarding()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  completed timestamptz;
BEGIN
  uid := (NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'x-hasura-user-id')::uuid;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET onboarding_completed_at = now()
  WHERE id = uid
    AND onboarding_completed_at IS NULL
  RETURNING onboarding_completed_at INTO completed;

  IF completed IS NULL THEN
    SELECT onboarding_completed_at
    INTO completed
    FROM public.profiles
    WHERE id = uid;
  END IF;

  RETURN completed;
END;
$$;

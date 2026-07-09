-- Hard-delete an auth account by email (admin SQL only — do not expose to client roles).
-- Removes auth.users and cascades to public.profiles + app data via FK ON DELETE CASCADE.

CREATE OR REPLACE FUNCTION public.purge_auth_account_by_email(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid;
BEGIN
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  SELECT u.id
  INTO uid
  FROM auth.users AS u
  WHERE lower(u.email) = lower(trim(p_email));

  IF uid IS NULL THEN
    RETURN NULL;
  END IF;

  DELETE FROM auth.users WHERE id = uid;

  RETURN uid;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_auth_account_by_email(text) FROM PUBLIC;

-- Backfill profiles for auth users created after deferred provisioning but before
-- ensure_user_profile was exposed in Hasura metadata (failed metadata apply).

DO $$
DECLARE
  auth_user_id uuid;
BEGIN
  FOR auth_user_id IN
    SELECT u.id
    FROM auth.users AS u
    WHERE COALESCE(u.disabled, false) = false
      AND NOT EXISTS (
        SELECT 1
        FROM public.profiles AS p
        WHERE p.id = u.id
      )
  LOOP
    PERFORM public.provision_user_profile(auth_user_id);
  END LOOP;
END;
$$;

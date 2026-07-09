-- Nhost/Hasura expose JWT user id via hasura.user and/or nested hasura claims.
-- Centralize lookup so SECURITY DEFINER RPCs work after OAuth token exchange.

CREATE OR REPLACE FUNCTION public.request_hasura_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH claims AS (
    SELECT NULLIF(current_setting('request.jwt.claims', true), '')::json AS raw
  )
  SELECT COALESCE(
    NULLIF(current_setting('hasura.user', true), '')::json ->> 'x-hasura-user-id',
    (SELECT raw ->> 'x-hasura-user-id' FROM claims),
    (SELECT raw -> 'https://hasura.io/jwt/claims' ->> 'x-hasura-user-id' FROM claims)
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION public.is_request_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH claims AS (
    SELECT NULLIF(current_setting('request.jwt.claims', true), '')::json AS raw
  )
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = public.request_hasura_user_id()
        AND p.role = 'admin'
    )
    OR COALESCE(
      NULLIF(current_setting('hasura.user', true), '')::json ->> 'x-hasura-default-role',
      (SELECT raw -> 'https://hasura.io/jwt/claims' ->> 'x-hasura-default-role' FROM claims),
      (SELECT raw ->> 'x-hasura-default-role' FROM claims)
    ) = 'admin',
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  profile public.profiles;
BEGIN
  uid := public.request_hasura_user_id();

  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM public.provision_user_profile(uid);

  SELECT *
  INTO profile
  FROM public.profiles
  WHERE id = uid;

  IF profile.id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  RETURN profile;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_my_onboarding()
RETURNS public.graphql_timestamptz_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  completed timestamptz;
  result public.graphql_timestamptz_result;
BEGIN
  uid := public.request_hasura_user_id();

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

  result.value := completed;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_legal_consent()
RETURNS public.graphql_timestamptz_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  accepted_at timestamptz := now();
  result public.graphql_timestamptz_result;
BEGIN
  uid := public.request_hasura_user_id();

  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET
    terms_accepted_at = COALESCE(terms_accepted_at, accepted_at),
    privacy_accepted_at = COALESCE(privacy_accepted_at, accepted_at)
  WHERE id = uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  result.value := accepted_at;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS public.graphql_uuid_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid;
  result public.graphql_uuid_result;
BEGIN
  uid := public.request_hasura_user_id();

  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM auth.users WHERE id = uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth user not found';
  END IF;

  result.value := uid;
  RETURN result;
END;
$$;

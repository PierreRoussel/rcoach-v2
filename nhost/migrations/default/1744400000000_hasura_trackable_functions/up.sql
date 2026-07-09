-- Hasura 2.48 only tracks functions returning a tracked table/composite type (not bare scalars).

CREATE TABLE IF NOT EXISTS public.graphql_jsonb_result (
  value jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.graphql_timestamptz_result (
  value timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS public.graphql_uuid_result (
  value uuid NOT NULL
);

DO $$
BEGIN
  IF to_regprocedure('public.admin_platform_metrics(date,date,integer)') IS NOT NULL
     AND to_regprocedure('public.admin_platform_metrics_jsonb(date,date,integer)') IS NULL THEN
    ALTER FUNCTION public.admin_platform_metrics(date, date, integer)
      RENAME TO admin_platform_metrics_jsonb;
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regprocedure('public.admin_platform_recent_lists(integer)') IS NOT NULL
     AND to_regprocedure('public.admin_platform_recent_lists_jsonb(integer)') IS NULL
     AND (
       SELECT format_type(p.prorettype, NULL) = 'jsonb'
       FROM pg_proc AS p
       INNER JOIN pg_namespace AS n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public'
         AND p.proname = 'admin_platform_recent_lists'
         AND pg_get_function_identity_arguments(p.oid) = 'p_limit integer'
       LIMIT 1
     ) THEN
    ALTER FUNCTION public.admin_platform_recent_lists(integer)
      RENAME TO admin_platform_recent_lists_jsonb;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.ensure_user_profile();
DROP FUNCTION IF EXISTS public.complete_my_onboarding();
DROP FUNCTION IF EXISTS public.record_legal_consent();
DROP FUNCTION IF EXISTS public.delete_my_account();
DROP FUNCTION IF EXISTS public.admin_platform_metrics(date, date, integer);
DROP FUNCTION IF EXISTS public.admin_platform_recent_lists(integer);

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
  uid := (NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'x-hasura-user-id')::uuid;

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
  uid := (NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'x-hasura-user-id')::uuid;

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
  uid := (NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'x-hasura-user-id')::uuid;

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

CREATE OR REPLACE FUNCTION public.admin_platform_metrics(
  p_from date,
  p_to date,
  p_cohort_weeks integer DEFAULT 12
)
RETURNS public.graphql_jsonb_result
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.graphql_jsonb_result;
BEGIN
  IF NOT public.is_request_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  result.value := public.admin_platform_metrics_jsonb(p_from, p_to, p_cohort_weeks);
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_platform_recent_lists(p_limit integer DEFAULT 25)
RETURNS public.graphql_jsonb_result
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.graphql_jsonb_result;
BEGIN
  IF NOT public.is_request_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  result.value := public.admin_platform_recent_lists_jsonb(p_limit);
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.record_legal_consent() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC;

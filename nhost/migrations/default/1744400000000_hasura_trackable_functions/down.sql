DROP FUNCTION IF EXISTS public.admin_platform_recent_lists(integer);
DROP FUNCTION IF EXISTS public.admin_platform_metrics(date, date, integer);

DO $$
BEGIN
  IF to_regprocedure('public.admin_platform_recent_lists_jsonb(integer)') IS NOT NULL THEN
    ALTER FUNCTION public.admin_platform_recent_lists_jsonb(integer)
      RENAME TO admin_platform_recent_lists;
  END IF;

  IF to_regprocedure('public.admin_platform_metrics_jsonb(date,date,integer)') IS NOT NULL THEN
    ALTER FUNCTION public.admin_platform_metrics_jsonb(date, date, integer)
      RENAME TO admin_platform_metrics;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.delete_my_account();
DROP FUNCTION IF EXISTS public.record_legal_consent();
DROP FUNCTION IF EXISTS public.complete_my_onboarding();
DROP FUNCTION IF EXISTS public.ensure_user_profile();

DROP TABLE IF EXISTS public.graphql_uuid_result;
DROP TABLE IF EXISTS public.graphql_timestamptz_result;
DROP TABLE IF EXISTS public.graphql_jsonb_result;

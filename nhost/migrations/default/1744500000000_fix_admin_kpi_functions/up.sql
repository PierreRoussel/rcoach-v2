-- Fix admin KPI SQL after 174440 rename left a recursive recent_lists_jsonb wrapper
-- and is_request_admin() read x-hasura-user-id from the wrong JWT path.

CREATE OR REPLACE FUNCTION public.is_request_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH claims AS (
    SELECT NULLIF(current_setting('request.jwt.claims', true), '')::json AS raw
  ),
  user_id AS (
    SELECT COALESCE(
      NULLIF(current_setting('hasura.user', true), '')::json ->> 'x-hasura-user-id',
      raw ->> 'x-hasura-user-id',
      raw -> 'https://hasura.io/jwt/claims' ->> 'x-hasura-user-id'
    )::uuid AS id
    FROM claims
  )
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.profiles AS p
      CROSS JOIN user_id AS u
      WHERE p.id = u.id
        AND p.role = 'admin'
    )
    OR COALESCE(
      NULLIF(current_setting('hasura.user', true), '')::json ->> 'x-hasura-default-role',
      (
        SELECT raw -> 'https://hasura.io/jwt/claims' ->> 'x-hasura-default-role'
        FROM claims
      )
    ) = 'admin',
    false
  );
$$;

DROP FUNCTION IF EXISTS public.admin_platform_recent_lists_jsonb(integer);

CREATE OR REPLACE FUNCTION public.admin_platform_recent_lists_jsonb(p_limit integer DEFAULT 25)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_recent_users jsonb;
  v_recent_subscriptions jsonb;
BEGIN
  IF NOT public.is_request_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 100);

  SELECT COALESCE(
    jsonb_agg(row_data ORDER BY created_at DESC),
    '[]'::jsonb
  )
  INTO v_recent_users
  FROM (
    SELECT
      jsonb_build_object(
        'id', p.id,
        'displayName', COALESCE(NULLIF(trim(p.display_name), ''), 'Sans nom'),
        'role', p.role,
        'createdAt', p.created_at,
        'onboardingCompletedAt', p.onboarding_completed_at,
        'isPremium', COALESCE(p.is_premium, false)
      ) AS row_data,
      p.created_at
    FROM public.profiles AS p
    ORDER BY p.created_at DESC
    LIMIT v_limit
  ) AS user_rows;

  SELECT COALESCE(
    jsonb_agg(row_data ORDER BY activity_at DESC),
    '[]'::jsonb
  )
  INTO v_recent_subscriptions
  FROM (
    SELECT
      jsonb_build_object(
        'id', s.id,
        'userId', s.user_id,
        'displayName', COALESCE(NULLIF(trim(pr.display_name), ''), 'Sans nom'),
        'tier', s.tier,
        'status', s.status,
        'billingPeriod', s.billing_period,
        'createdAt', s.created_at,
        'updatedAt', s.updated_at,
        'currentPeriodEnd', s.current_period_end,
        'trialConsumedAt', s.trial_consumed_at
      ) AS row_data,
      GREATEST(s.created_at, s.updated_at) AS activity_at
    FROM public.subscriptions AS s
    LEFT JOIN public.profiles AS pr ON pr.id = s.user_id
    ORDER BY GREATEST(s.created_at, s.updated_at) DESC
    LIMIT v_limit
  ) AS subscription_rows;

  RETURN jsonb_build_object(
    'recentUsers', v_recent_users,
    'recentSubscriptions', v_recent_subscriptions,
    'limit', v_limit
  );
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

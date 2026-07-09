-- Admin KPI auth moves to Nhost function `admin-kpi` (profiles.role check + admin secret GraphQL).
-- SQL functions are only callable via admin secret; remove is_request_admin() guards.

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
  result.value := public.admin_platform_recent_lists_jsonb(p_limit);
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_support_requests(p_limit integer DEFAULT 50)
RETURNS public.graphql_jsonb_result
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.graphql_jsonb_result;
BEGIN
  result.value := public.admin_support_requests_jsonb(p_limit);
  RETURN result;
END;
$$;

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

CREATE OR REPLACE FUNCTION public.admin_support_requests_jsonb(p_limit integer DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_requests jsonb;
BEGIN
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);

  SELECT COALESCE(
    jsonb_agg(row_data ORDER BY created_at DESC),
    '[]'::jsonb
  )
  INTO v_requests
  FROM (
    SELECT
      jsonb_build_object(
        'id', r.id,
        'userId', r.user_id,
        'displayName', COALESCE(NULLIF(trim(p.display_name), ''), 'Sans nom'),
        'subject', r.subject,
        'message', r.message,
        'status', r.status,
        'createdAt', r.created_at,
        'updatedAt', r.updated_at
      ) AS row_data,
      r.created_at
    FROM public.support_requests AS r
    LEFT JOIN public.profiles AS p ON p.id = r.user_id
    ORDER BY r.created_at DESC
    LIMIT v_limit
  ) AS request_rows;

  RETURN jsonb_build_object(
    'requests', v_requests,
    'limit', v_limit
  );
END;
$$;

-- admin_platform_metrics_jsonb: drop auth guard only (body unchanged).
CREATE OR REPLACE FUNCTION public.admin_platform_metrics_jsonb(
  p_from date,
  p_to date,
  p_cohort_weeks integer DEFAULT 12
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary jsonb;
  v_signups_daily jsonb;
  v_active_users_daily jsonb;
  v_subscriptions_breakdown jsonb;
  v_feature_usage_daily jsonb;
  v_funnel jsonb;
  v_retention_cohorts jsonb;
  v_revenue jsonb;
  v_churn_reasons jsonb;
  v_ops jsonb;
BEGIN
  IF p_from IS NULL OR p_to IS NULL OR p_from > p_to THEN
    RAISE EXCEPTION 'invalid date range';
  END IF;

  SELECT jsonb_build_object(
    'totalUsers', (SELECT count(*)::int FROM public.profiles),
    'newUsersInRange', (
      SELECT count(*)::int
      FROM public.profiles
      WHERE created_at::date BETWEEN p_from AND p_to
    ),
    'onboardingCompleted', (
      SELECT count(*)::int
      FROM public.profiles
      WHERE onboarding_completed_at IS NOT NULL
    ),
    'premiumActive', (
      SELECT count(*)::int
      FROM public.subscriptions AS s
      WHERE public.subscription_is_premium_active(s.tier, s.status, s.current_period_end)
    ),
    'freeActive', (
      SELECT count(*)::int
      FROM public.subscriptions AS s
      WHERE NOT public.subscription_is_premium_active(s.tier, s.status, s.current_period_end)
    ),
    'trialingActive', (
      SELECT count(*)::int
      FROM public.subscriptions AS s
      WHERE s.status = 'trialing'
        AND public.subscription_is_premium_active(s.tier, s.status, s.current_period_end)
    ),
    'canceledSubscriptions', (
      SELECT count(*)::int
      FROM public.subscriptions AS s
      WHERE s.status = 'canceled'
    ),
    'latestDau', COALESCE((
      SELECT count(DISTINCT user_id)::int
      FROM (
        SELECT w.user_id
        FROM public.workouts AS w
        WHERE w.started_at::date = p_to
        UNION
        SELECT m.user_id
        FROM public.meal_log_entries AS m
        WHERE m.logged_date = p_to
      ) AS active_users
    ), 0)
  )
  INTO v_summary;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', day::text,
        'count', signup_count,
        'cumulative', cumulative_count
      )
      ORDER BY day
    ),
    '[]'::jsonb
  )
  INTO v_signups_daily
  FROM (
    SELECT
      gs.day,
      COALESCE(signups.count, 0)::int AS signup_count,
      sum(COALESCE(signups.count, 0)) OVER (ORDER BY gs.day)::int AS cumulative_count
    FROM generate_series(p_from, p_to, interval '1 day') AS gs(day)
    LEFT JOIN (
      SELECT created_at::date AS day, count(*) AS count
      FROM public.profiles
      WHERE created_at::date BETWEEN p_from AND p_to
      GROUP BY 1
    ) AS signups ON signups.day = gs.day::date
  ) AS signup_series;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', day::text,
        'dau', dau
      )
      ORDER BY day
    ),
    '[]'::jsonb
  )
  INTO v_active_users_daily
  FROM (
    SELECT
      gs.day,
      COALESCE(active.count, 0)::int AS dau
    FROM generate_series(p_from, p_to, interval '1 day') AS gs(day)
    LEFT JOIN (
      SELECT activity.day, count(DISTINCT activity.user_id) AS count
      FROM (
        SELECT w.started_at::date AS day, w.user_id
        FROM public.workouts AS w
        WHERE w.started_at::date BETWEEN p_from AND p_to
        UNION ALL
        SELECT m.logged_date AS day, m.user_id
        FROM public.meal_log_entries AS m
        WHERE m.logged_date BETWEEN p_from AND p_to
      ) AS activity
      GROUP BY activity.day
    ) AS active ON active.day = gs.day::date
  ) AS dau_series;

  SELECT COALESCE(
    jsonb_agg(row_data),
    '[]'::jsonb
  )
  INTO v_subscriptions_breakdown
  FROM (
    SELECT jsonb_build_object(
      'tier', s.tier,
      'status', s.status,
      'billingPeriod', s.billing_period,
      'count', count(*)::int
    ) AS row_data
    FROM public.subscriptions AS s
    GROUP BY s.tier, s.status, s.billing_period
  ) AS breakdown_rows;

  SELECT jsonb_build_object(
    'workoutsDaily', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('date', day::text, 'count', count)
        ORDER BY day
      )
      FROM (
        SELECT w.started_at::date AS day, count(*)::int AS count
        FROM public.workouts AS w
        WHERE w.started_at::date BETWEEN p_from AND p_to
        GROUP BY 1
      ) AS workout_days
    ), '[]'::jsonb),
    'mealsDaily', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('date', day::text, 'count', count)
        ORDER BY day
      )
      FROM (
        SELECT m.logged_date AS day, count(*)::int AS count
        FROM public.meal_log_entries AS m
        WHERE m.logged_date BETWEEN p_from AND p_to
        GROUP BY 1
      ) AS meal_days
    ), '[]'::jsonb),
    'weightGoalsDaily', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('date', day::text, 'count', count)
        ORDER BY day
      )
      FROM (
        SELECT g.created_at::date AS day, count(*)::int AS count
        FROM public.weight_goals AS g
        WHERE g.created_at::date BETWEEN p_from AND p_to
        GROUP BY 1
      ) AS goal_days
    ), '[]'::jsonb),
    'friendshipsDaily', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('date', day::text, 'count', count)
        ORDER BY day
      )
      FROM (
        SELECT f.created_at::date AS day, count(*)::int AS count
        FROM public.friendships AS f
        WHERE f.created_at::date BETWEEN p_from AND p_to
        GROUP BY 1
      ) AS friendship_days
    ), '[]'::jsonb),
    'coachClientsDaily', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('date', day::text, 'count', count)
        ORDER BY day
      )
      FROM (
        SELECT c.created_at::date AS day, count(*)::int AS count
        FROM public.coach_clients AS c
        WHERE c.created_at::date BETWEEN p_from AND p_to
        GROUP BY 1
      ) AS coach_client_days
    ), '[]'::jsonb),
    'activeCoaches', (
      SELECT count(DISTINCT c.coach_id)::int
      FROM public.coach_clients AS c
      WHERE c.status = 'active'
    )
  )
  INTO v_feature_usage_daily;

  SELECT jsonb_build_object(
    'registered', (SELECT count(*)::int FROM public.profiles),
    'onboardingCompleted', (
      SELECT count(*)::int
      FROM public.profiles
      WHERE onboarding_completed_at IS NOT NULL
    ),
    'firstWorkout', (
      SELECT count(DISTINCT w.user_id)::int
      FROM public.workouts AS w
    ),
    'firstMeal', (
      SELECT count(DISTINCT m.user_id)::int
      FROM public.meal_log_entries AS m
    ),
    'trialStarted', (
      SELECT count(*)::int
      FROM public.subscriptions AS s
      WHERE s.trial_consumed_at IS NOT NULL
    )
  )
  INTO v_funnel;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'cohortWeek', cohort_week::text,
        'signupCount', signup_count,
        'retentionJ7Pct', retention_j7_pct,
        'retentionJ30Pct', retention_j30_pct
      )
      ORDER BY cohort_week DESC
    ),
    '[]'::jsonb
  )
  INTO v_retention_cohorts
  FROM (
    SELECT
      date_trunc('week', p.created_at)::date AS cohort_week,
      count(*)::int AS signup_count,
      round(
        100.0 * count(*) FILTER (
          WHERE EXISTS (
            SELECT 1
            FROM (
              SELECT w.user_id
              FROM public.workouts AS w
              WHERE w.user_id = p.id
                AND w.started_at::date BETWEEN p.created_at::date AND p.created_at::date + 7
              UNION ALL
              SELECT m.user_id
              FROM public.meal_log_entries AS m
              WHERE m.user_id = p.id
                AND m.logged_date BETWEEN p.created_at::date AND p.created_at::date + 7
            ) AS active_j7
          )
        ) / NULLIF(count(*), 0),
        1
      ) AS retention_j7_pct,
      round(
        100.0 * count(*) FILTER (
          WHERE EXISTS (
            SELECT 1
            FROM (
              SELECT w.user_id
              FROM public.workouts AS w
              WHERE w.user_id = p.id
                AND w.started_at::date BETWEEN p.created_at::date AND p.created_at::date + 30
              UNION ALL
              SELECT m.user_id
              FROM public.meal_log_entries AS m
              WHERE m.user_id = p.id
                AND m.logged_date BETWEEN p.created_at::date AND p.created_at::date + 30
            ) AS active_j30
          )
        ) / NULLIF(count(*), 0),
        1
      ) AS retention_j30_pct
    FROM public.profiles AS p
    WHERE p.created_at::date >= (date_trunc('week', p_to::timestamp) - ((GREATEST(p_cohort_weeks, 1) - 1) * interval '1 week'))::date
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT GREATEST(p_cohort_weeks, 1)
  ) AS cohorts;

  SELECT jsonb_build_object(
    'monthlySubscribers', monthly_count,
    'annualSubscribers', annual_count,
    'mrrCents', mrr_cents,
    'arrCents', arr_cents,
    'isEstimate', true
  )
  INTO v_revenue
  FROM (
    SELECT
      count(*) FILTER (
        WHERE s.billing_period = 'monthly'
      )::int AS monthly_count,
      count(*) FILTER (
        WHERE s.billing_period = 'annual'
      )::int AS annual_count,
      (
        count(*) FILTER (WHERE s.billing_period = 'monthly') * 999
        + round(count(*) FILTER (WHERE s.billing_period = 'annual') * 4999.0 / 12.0)
      )::int AS mrr_cents,
      (
        count(*) FILTER (WHERE s.billing_period = 'monthly') * 999 * 12
        + count(*) FILTER (WHERE s.billing_period = 'annual') * 4999
      )::int AS arr_cents
    FROM public.subscriptions AS s
    WHERE public.subscription_is_premium_active(s.tier, s.status, s.current_period_end)
  ) AS revenue;

  SELECT COALESCE(
    jsonb_agg(row_data ORDER BY row_count DESC),
    '[]'::jsonb
  )
  INTO v_churn_reasons
  FROM (
    SELECT
      count(*)::int AS row_count,
      jsonb_build_object(
        'reason', COALESCE(NULLIF(trim(f.reason), ''), 'non_renseigne'),
        'count', count(*)::int
      ) AS row_data
    FROM public.subscription_cancellation_feedback AS f
    WHERE f.created_at::date BETWEEN p_from AND p_to
    GROUP BY COALESCE(NULLIF(trim(f.reason), ''), 'non_renseigne')
  ) AS churn_rows;

  SELECT jsonb_build_object(
    'profiles', (SELECT count(*)::int FROM public.profiles),
    'subscriptions', (SELECT count(*)::int FROM public.subscriptions),
    'workouts', (SELECT count(*)::int FROM public.workouts),
    'mealLogEntries', (SELECT count(*)::int FROM public.meal_log_entries),
    'latestProfileAt', (SELECT max(created_at) FROM public.profiles),
    'latestWorkoutAt', (SELECT max(started_at) FROM public.workouts),
    'latestMealLogAt', (SELECT max(created_at) FROM public.meal_log_entries)
  )
  INTO v_ops;

  RETURN jsonb_build_object(
    'summary', v_summary,
    'signupsDaily', v_signups_daily,
    'activeUsersDaily', v_active_users_daily,
    'subscriptionsBreakdown', v_subscriptions_breakdown,
    'featureUsageDaily', v_feature_usage_daily,
    'funnel', v_funnel,
    'retentionCohorts', v_retention_cohorts,
    'revenue', v_revenue,
    'churnReasons', v_churn_reasons,
    'ops', v_ops,
    'range', jsonb_build_object(
      'from', p_from::text,
      'to', p_to::text,
      'cohortWeeks', GREATEST(p_cohort_weeks, 1)
    )
  );
END;
$$;

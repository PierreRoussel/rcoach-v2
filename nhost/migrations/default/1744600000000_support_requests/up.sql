-- In-app support requests (admin dashboard listing + user submissions).

CREATE TABLE public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK (char_length(trim(subject)) > 0),
  message TEXT NOT NULL CHECK (char_length(trim(message)) > 0),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX support_requests_created_at_idx
  ON public.support_requests (created_at DESC);

CREATE OR REPLACE FUNCTION public.support_requests_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER support_requests_updated_at
  BEFORE UPDATE ON public.support_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.support_requests_set_updated_at();

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
  IF NOT public.is_request_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

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
  IF NOT public.is_request_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  result.value := public.admin_support_requests_jsonb(p_limit);
  RETURN result;
END;
$$;

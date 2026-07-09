-- Fix admin KPI "forbidden" when Hasura exposes flat JWT claims in hasura.user
-- but SECURITY DEFINER helpers could not read session GUCs on remote Nhost.
-- request_hasura_user_id() runs as SECURITY INVOKER; is_request_admin() keeps DEFINER for profiles.

CREATE OR REPLACE FUNCTION public._jwt_guc_text(p_name text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN NULLIF(current_setting(p_name, true), '');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public._extract_uuid_from_jwt_text(p_raw text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid_text text;
  parsed json;
BEGIN
  IF p_raw IS NULL OR btrim(p_raw) = '' THEN
    RETURN NULL;
  END IF;

  IF p_raw ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    RETURN p_raw::uuid;
  END IF;

  BEGIN
    parsed := p_raw::json;
    uid_text := COALESCE(
      parsed ->> 'x-hasura-user-id',
      parsed -> 'https://hasura.io/jwt/claims' ->> 'x-hasura-user-id',
      parsed ->> 'sub',
      parsed ->> 'user-id'
    );

    IF uid_text IS NOT NULL AND btrim(uid_text) <> '' THEN
      RETURN uid_text::uuid;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  uid_text := substring(
    p_raw
    FROM '([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})'
  );

  IF uid_text IS NOT NULL AND btrim(uid_text) <> '' THEN
    RETURN uid_text::uuid;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public._request_hasura_role_claim()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  guc text;
  gucs text[] := ARRAY[
    'request.jwt.claim.x-hasura-role',
    'request.jwt.claim.x-hasura-default-role',
    'hasura.user',
    'request.jwt.claims',
    'hasura.claims'
  ];
  raw text;
  parsed json;
  role_text text;
BEGIN
  FOREACH guc IN ARRAY gucs LOOP
    raw := public._jwt_guc_text(guc);

    IF raw IS NULL THEN
      CONTINUE;
    END IF;

    IF guc IN (
      'request.jwt.claim.x-hasura-role',
      'request.jwt.claim.x-hasura-default-role'
    ) THEN
      role_text := raw;
    ELSE
      BEGIN
        parsed := raw::json;
        role_text := COALESCE(
          parsed ->> 'x-hasura-role',
          parsed ->> 'x-hasura-default-role',
          parsed -> 'https://hasura.io/jwt/claims' ->> 'x-hasura-role',
          parsed -> 'https://hasura.io/jwt/claims' ->> 'x-hasura-default-role'
        );
      EXCEPTION
        WHEN OTHERS THEN
          role_text := NULL;
      END;

      IF role_text IS NULL THEN
        role_text := substring(
          raw
          FROM '"x-hasura-(?:default-)?role"\s*:\s*"([^"]+)"'
        );
      END IF;
    END IF;

    IF role_text = 'admin' THEN
      RETURN 'admin';
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_hasura_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  guc text;
  gucs text[] := ARRAY[
    'request.jwt.claim.x-hasura-user-id',
    'hasura.user',
    'request.jwt.claims',
    'request.jwt.claim.sub',
    'hasura.claims'
  ];
  uid uuid;
BEGIN
  FOREACH guc IN ARRAY gucs LOOP
    uid := public._extract_uuid_from_jwt_text(public._jwt_guc_text(guc));

    IF uid IS NOT NULL THEN
      RETURN uid;
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_request_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  IF public._request_hasura_role_claim() = 'admin' THEN
    RETURN true;
  END IF;

  uid := public.request_hasura_user_id();

  IF uid IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = uid
      AND p.role = 'admin'
  );
END;
$$;

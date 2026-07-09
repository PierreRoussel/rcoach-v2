-- Hotfix: exécuter dans Nhost → Hasura → Data → SQL si le dashboard admin renvoie "forbidden"
-- ou "JWT Hasura" alors que profiles.role = 'admin'.

CREATE OR REPLACE FUNCTION public.request_hasura_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw json;
  hasura_user json;
  uid_text text;
BEGIN
  BEGIN
    hasura_user := NULLIF(current_setting('hasura.user', true), '')::json;
  EXCEPTION
    WHEN OTHERS THEN
      hasura_user := NULL;
  END;

  uid_text := COALESCE(
    hasura_user ->> 'x-hasura-user-id',
    hasura_user ->> 'user-id'
  );

  IF uid_text IS NOT NULL AND btrim(uid_text) <> '' THEN
    RETURN uid_text::uuid;
  END IF;

  uid_text := NULLIF(current_setting('request.jwt.claim.x-hasura-user-id', true), '');
  IF uid_text IS NOT NULL AND btrim(uid_text) <> '' THEN
    RETURN uid_text::uuid;
  END IF;

  BEGIN
    raw := NULLIF(current_setting('request.jwt.claims', true), '')::json;
  EXCEPTION
    WHEN OTHERS THEN
      raw := NULL;
  END;

  IF raw IS NOT NULL THEN
    uid_text := COALESCE(
      raw ->> 'x-hasura-user-id',
      raw -> 'https://hasura.io/jwt/claims' ->> 'x-hasura-user-id',
      raw ->> 'sub'
    );

    IF uid_text IS NOT NULL AND btrim(uid_text) <> '' THEN
      RETURN uid_text::uuid;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_request_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = public.request_hasura_user_id()
        AND p.role = 'admin'
    ),
    false
  );
$$;

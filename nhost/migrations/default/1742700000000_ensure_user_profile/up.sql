-- Ensures public.profiles row exists for the authenticated user (signup trigger race / legacy accounts).

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  user_email text;
  user_display_name text;
BEGIN
  uid := (NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'x-hasura-user-id')::uuid;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = uid) THEN
    RETURN uid;
  END IF;

  SELECT u.email, u.display_name
  INTO user_email, user_display_name
  FROM auth.users AS u
  WHERE u.id = uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth user not found';
  END IF;

  INSERT INTO public.profiles (id, display_name, friend_code, email)
  VALUES (
    uid,
    COALESCE(NULLIF(user_display_name, ''), split_part(user_email, '@', 1), 'User'),
    public.generate_friend_code(),
    user_email
  );

  RETURN uid;
END;
$$;

-- Backfill profiles for auth users missing a row (legacy / failed signup trigger).
INSERT INTO public.profiles (id, display_name, friend_code, email)
SELECT
  u.id,
  COALESCE(NULLIF(u.display_name, ''), split_part(u.email, '@', 1), 'User'),
  public.generate_friend_code(),
  u.email
FROM auth.users AS u
LEFT JOIN public.profiles AS p ON p.id = u.id
WHERE p.id IS NULL;

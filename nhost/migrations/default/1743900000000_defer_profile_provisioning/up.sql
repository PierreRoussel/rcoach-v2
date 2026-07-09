-- Profile + subscription are provisioned on first authenticated session only
-- (ensure_user_profile), not on auth.users INSERT. Prevents orphan profiles when
-- signup fails, the auth user is disabled, or auth.users is removed without CASCADE.

CREATE OR REPLACE FUNCTION public.provision_user_profile(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  user_display_name text;
  user_avatar_url text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RETURN p_user_id;
  END IF;

  SELECT u.email, u.display_name, u.avatar_url
  INTO user_email, user_display_name, user_avatar_url
  FROM auth.users AS u
  WHERE u.id = p_user_id
    AND COALESCE(u.disabled, false) = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth user not found or disabled';
  END IF;

  INSERT INTO public.profiles (id, display_name, friend_code, email, avatar_url)
  VALUES (
    p_user_id,
    COALESCE(NULLIF(user_display_name, ''), split_part(user_email, '@', 1), 'User'),
    public.generate_friend_code(),
    user_email,
    NULLIF(user_avatar_url, '')
  );

  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (p_user_id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.friendships
  SET addressee_id = p_user_id
  WHERE addressee_id IS NULL
    AND invited_email IS NOT NULL
    AND lower(invited_email) = lower(user_email)
    AND status = 'pending';

  RETURN p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := (NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'x-hasura-user-id')::uuid;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN public.provision_user_profile(uid);
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_profile_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM auth.users AS u
    WHERE u.id = NEW.id
      AND COALESCE(u.disabled, false) = false
  ) THEN
    RAISE EXCEPTION 'Cannot create profile without an active auth user';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_validate_auth_user ON public.profiles;

CREATE TRIGGER profiles_validate_auth_user
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_auth_user();

-- Legacy rows: profile without matching auth.users (manual deletes, failed signups).
DELETE FROM public.profiles AS p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users AS u WHERE u.id = p.id
);

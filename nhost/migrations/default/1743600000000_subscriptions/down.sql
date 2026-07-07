DROP TRIGGER IF EXISTS subscriptions_sync_premium ON public.subscriptions;
DROP FUNCTION IF EXISTS public.sync_profile_premium_status();

DROP TABLE IF EXISTS public.subscription_cancellation_feedback;
DROP TABLE IF EXISTS public.subscriptions;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_premium;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, friend_code, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.display_name, split_part(NEW.email, '@', 1), 'User'),
    public.generate_friend_code(),
    NEW.email,
    NULLIF(NEW.avatar_url, '')
  );

  UPDATE public.friendships
  SET addressee_id = NEW.id
  WHERE addressee_id IS NULL
    AND invited_email IS NOT NULL
    AND lower(invited_email) = lower(NEW.email)
    AND status = 'pending';

  RETURN NEW;
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
  user_email text;
  user_display_name text;
  user_avatar_url text;
BEGIN
  uid := (NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'x-hasura-user-id')::uuid;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = uid) THEN
    RETURN uid;
  END IF;

  SELECT u.email, u.display_name, u.avatar_url
  INTO user_email, user_display_name, user_avatar_url
  FROM auth.users AS u
  WHERE u.id = uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth user not found';
  END IF;

  INSERT INTO public.profiles (id, display_name, friend_code, email, avatar_url)
  VALUES (
    uid,
    COALESCE(NULLIF(user_display_name, ''), split_part(user_email, '@', 1), 'User'),
    public.generate_friend_code(),
    user_email,
    NULLIF(user_avatar_url, '')
  );

  RETURN uid;
END;
$$;

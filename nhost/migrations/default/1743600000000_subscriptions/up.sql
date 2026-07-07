-- Subscriptions, premium denormalization on profiles, cancellation feedback.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'premium')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'trialing', 'canceled', 'past_due')),
  billing_period TEXT
    CHECK (billing_period IS NULL OR billing_period IN ('monthly', 'annual')),
  current_period_end TIMESTAMPTZ,
  provider TEXT NOT NULL DEFAULT 'none'
    CHECK (provider IN ('none', 'play', 'stripe', 'revenuecat')),
  provider_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.subscription_cancellation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.sync_profile_premium_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET is_premium = (NEW.tier = 'premium' AND NEW.status IN ('active', 'trialing'))
  WHERE id = NEW.user_id;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_sync_premium
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_premium_status();

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

  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active');

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

  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (uid, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN uid;
END;
$$;

INSERT INTO public.subscriptions (user_id, tier, status)
SELECT p.id, 'free', 'active'
FROM public.profiles AS p
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions AS s WHERE s.user_id = p.id
);

UPDATE public.profiles AS p
SET is_premium = EXISTS (
  SELECT 1
  FROM public.subscriptions AS s
  WHERE s.user_id = p.id
    AND s.tier = 'premium'
    AND s.status IN ('active', 'trialing')
);

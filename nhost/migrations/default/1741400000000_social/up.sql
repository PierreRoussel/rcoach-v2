-- Social: friend codes, friendships, motivations

CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  candidate TEXT;
BEGIN
  LOOP
    candidate := 'RCOACH-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE friend_code = candidate
    );
  END LOOP;
  RETURN candidate;
END;
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS friend_code TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles p
SET
  friend_code = COALESCE(p.friend_code, public.generate_friend_code()),
  email = u.email
FROM auth.users u
WHERE p.id = u.id;

UPDATE public.profiles
SET friend_code = public.generate_friend_code()
WHERE friend_code IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN friend_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_friend_code_key
  ON public.profiles (friend_code);

CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT friendships_not_self CHECK (
    addressee_id IS NULL OR requester_id <> addressee_id
  ),
  CONSTRAINT friendships_target CHECK (
    addressee_id IS NOT NULL OR invited_email IS NOT NULL
  )
);

CREATE UNIQUE INDEX friendships_pair_key
  ON public.friendships (
    LEAST(requester_id, addressee_id),
    GREATEST(requester_id, addressee_id)
  )
  WHERE addressee_id IS NOT NULL AND status <> 'declined';

CREATE UNIQUE INDEX friendships_email_invite_key
  ON public.friendships (requester_id, lower(invited_email))
  WHERE invited_email IS NOT NULL AND status = 'pending';

CREATE INDEX friendships_requester_idx ON public.friendships (requester_id);
CREATE INDEX friendships_addressee_idx ON public.friendships (addressee_id);

CREATE TABLE public.friend_motivations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  preset_key TEXT NOT NULL DEFAULT 'custom'
    CHECK (preset_key IN ('fire', 'muscle', 'clap', 'custom')),
  read_at TIMESTAMPTZ,
  hearted_at TIMESTAMPTZ,
  reply_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT friend_motivations_not_self CHECK (sender_id <> recipient_id),
  CONSTRAINT friend_motivations_message_len CHECK (char_length(message) <= 80),
  CONSTRAINT friend_motivations_reply_len CHECK (
    reply_message IS NULL OR char_length(reply_message) <= 80
  )
);

CREATE INDEX friend_motivations_recipient_unread_idx
  ON public.friend_motivations (recipient_id)
  WHERE read_at IS NULL;

CREATE INDEX friend_motivations_recipient_idx
  ON public.friend_motivations (recipient_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, friend_code, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.display_name, split_part(NEW.email, '@', 1), 'User'),
    public.generate_friend_code(),
    NEW.email
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

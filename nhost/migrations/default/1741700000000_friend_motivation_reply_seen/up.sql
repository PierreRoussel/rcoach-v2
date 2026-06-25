ALTER TABLE public.friend_motivations
  ADD COLUMN IF NOT EXISTS sender_reply_seen_at TIMESTAMPTZ;

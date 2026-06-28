CREATE TABLE public.waist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  waist_cm NUMERIC(6, 2) NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'manual'
);

CREATE INDEX waist_entries_user_logged_idx
  ON public.waist_entries (user_id, logged_at DESC);

INSERT INTO public.waist_entries (user_id, waist_cm, logged_at, source)
SELECT user_id, waist_cm, updated_at, 'profile'
FROM public.user_measurements
WHERE waist_cm IS NOT NULL;

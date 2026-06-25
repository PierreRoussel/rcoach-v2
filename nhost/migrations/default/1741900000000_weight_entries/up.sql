CREATE TABLE public.weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weight_kg NUMERIC(6, 2) NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'manual'
);

CREATE INDEX weight_entries_user_logged_idx
  ON public.weight_entries (user_id, logged_at DESC);

-- Backfill historical points for existing weight goals
INSERT INTO public.weight_entries (user_id, weight_kg, logged_at, source)
SELECT user_id, start_weight_kg, created_at, 'goal_start'
FROM public.weight_goals
WHERE start_weight_kg IS NOT NULL;

INSERT INTO public.weight_entries (user_id, weight_kg, logged_at, source)
SELECT user_id, current_weight_kg, updated_at, 'adjust'
FROM public.weight_goals
WHERE current_weight_kg IS NOT NULL
  AND updated_at IS DISTINCT FROM created_at;

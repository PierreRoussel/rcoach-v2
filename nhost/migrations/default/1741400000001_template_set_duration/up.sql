ALTER TABLE public.workout_template_sets
  ADD COLUMN IF NOT EXISTS duration_seconds INT;

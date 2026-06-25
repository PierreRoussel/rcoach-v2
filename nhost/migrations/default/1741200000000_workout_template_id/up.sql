ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS workout_template_id UUID
    REFERENCES public.workout_templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS workouts_template_started_idx
  ON public.workouts (user_id, workout_template_id, started_at DESC)
  WHERE workout_template_id IS NOT NULL;

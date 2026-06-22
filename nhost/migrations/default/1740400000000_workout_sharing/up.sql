ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE;

CREATE INDEX IF NOT EXISTS workouts_share_token_idx
  ON public.workouts (share_token)
  WHERE share_token IS NOT NULL;

ALTER TABLE public.workout_templates
  ADD COLUMN IF NOT EXISTS source_workout_id UUID
    REFERENCES public.workouts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS workout_templates_source_workout_idx
  ON public.workout_templates (source_workout_id)
  WHERE source_workout_id IS NOT NULL;

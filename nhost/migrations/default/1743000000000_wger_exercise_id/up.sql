ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS wger_exercise_id INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS exercises_wger_exercise_id_unique_idx
  ON public.exercises (wger_exercise_id)
  WHERE wger_exercise_id IS NOT NULL;

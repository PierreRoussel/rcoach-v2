DROP INDEX IF EXISTS public.exercises_wger_exercise_id_unique_idx;

ALTER TABLE public.exercises
  DROP COLUMN IF EXISTS wger_exercise_id;

DROP INDEX IF EXISTS workouts_template_started_idx;

ALTER TABLE public.workouts
  DROP COLUMN IF EXISTS workout_template_id;

ALTER TABLE public.workouts
  DROP COLUMN IF EXISTS session_mode;

ALTER TABLE public.workout_template_exercises
  DROP COLUMN IF EXISTS emom_group_id,
  DROP COLUMN IF EXISTS target_reps;

ALTER TABLE public.workout_templates
  DROP COLUMN IF EXISTS emom_total_minutes,
  DROP COLUMN IF EXISTS emom_interval_seconds,
  DROP COLUMN IF EXISTS session_mode;

DROP INDEX IF EXISTS workout_templates_source_workout_idx;
ALTER TABLE public.workout_templates DROP COLUMN IF EXISTS source_workout_id;

DROP INDEX IF EXISTS workouts_share_token_idx;
ALTER TABLE public.workouts DROP COLUMN IF EXISTS share_token;

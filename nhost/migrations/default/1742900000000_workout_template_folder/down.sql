DROP INDEX IF EXISTS workout_templates_user_folder_idx;

ALTER TABLE public.workout_templates
  DROP COLUMN IF EXISTS folder_name;

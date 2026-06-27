ALTER TABLE public.workout_templates
  ADD COLUMN IF NOT EXISTS folder_name TEXT NULL;

CREATE INDEX IF NOT EXISTS workout_templates_user_folder_idx
  ON public.workout_templates (user_id, folder_name)
  WHERE folder_name IS NOT NULL;

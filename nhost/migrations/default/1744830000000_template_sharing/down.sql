DROP INDEX IF EXISTS workout_templates_share_token_idx;

ALTER TABLE public.workout_templates
  DROP COLUMN IF EXISTS share_token;

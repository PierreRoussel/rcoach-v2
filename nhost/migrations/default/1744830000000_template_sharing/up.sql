ALTER TABLE public.workout_templates
  ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE;

CREATE INDEX IF NOT EXISTS workout_templates_share_token_idx
  ON public.workout_templates (share_token)
  WHERE share_token IS NOT NULL;

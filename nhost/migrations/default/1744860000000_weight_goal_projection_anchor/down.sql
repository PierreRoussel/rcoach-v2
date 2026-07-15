ALTER TABLE public.weight_goals
  DROP COLUMN IF EXISTS projected_completion_at,
  DROP COLUMN IF EXISTS projection_computed_at,
  DROP COLUMN IF EXISTS projection_weekly_rate_kg;

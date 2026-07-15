ALTER TABLE public.weight_goals
  ADD COLUMN IF NOT EXISTS projected_completion_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS projection_computed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS projection_weekly_rate_kg NUMERIC(5, 3);

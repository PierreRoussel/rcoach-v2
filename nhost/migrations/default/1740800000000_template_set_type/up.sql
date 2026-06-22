ALTER TABLE public.workout_template_sets
  ADD COLUMN set_type TEXT NOT NULL DEFAULT 'normal'
    CHECK (set_type IN ('normal', 'warmup', 'failure'));

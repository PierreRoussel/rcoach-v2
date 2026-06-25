ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS tracking_mode TEXT NOT NULL DEFAULT 'auto'
    CHECK (tracking_mode IN ('auto', 'weighted', 'bodyweight', 'timed', 'cardio'));

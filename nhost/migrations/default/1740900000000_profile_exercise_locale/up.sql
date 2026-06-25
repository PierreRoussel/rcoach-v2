ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS exercise_locale TEXT NOT NULL DEFAULT 'fr'
  CHECK (exercise_locale IN ('fr', 'en'));

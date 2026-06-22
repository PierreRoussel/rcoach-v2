-- Ensure all app tables exist (safe if already created by earlier migrations).

CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.program_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_day_id UUID NOT NULL REFERENCES public.program_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  sort_order INT NOT NULL DEFAULT 0,
  target_sets INT,
  target_reps TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coach_id, athlete_id)
);

CREATE TABLE IF NOT EXISTS public.workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.workout_template_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_exercise_id UUID NOT NULL
    REFERENCES public.workout_template_exercises(id) ON DELETE CASCADE,
  set_index INT NOT NULL,
  weight_kg NUMERIC(6, 2),
  reps INT,
  rest_seconds INT NOT NULL DEFAULT 90
);

CREATE TABLE IF NOT EXISTS public.scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  workout_template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  recurrence_type TEXT NOT NULL DEFAULT 'once'
    CHECK (recurrence_type IN ('once', 'weekly')),
  weekdays SMALLINT[] NULL,
  scheduled_date DATE NULL,
  time_local TIME NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rpe_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.workout_templates
  ADD COLUMN IF NOT EXISTS default_rest_seconds INT NOT NULL DEFAULT 90;

ALTER TABLE public.workout_templates
  ADD COLUMN IF NOT EXISTS source_workout_id UUID
    REFERENCES public.workouts(id) ON DELETE SET NULL;

ALTER TABLE public.workout_template_exercises
  ADD COLUMN IF NOT EXISTS superset_id INT;

ALTER TABLE public.workout_template_exercises
  ADD COLUMN IF NOT EXISTS default_rest_seconds INT NOT NULL DEFAULT 90;

ALTER TABLE public.workout_template_sets
  ADD COLUMN IF NOT EXISTS set_type TEXT NOT NULL DEFAULT 'normal';

ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS share_token UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_sessions_once_requires_date'
  ) THEN
    ALTER TABLE public.scheduled_sessions
      ADD CONSTRAINT scheduled_sessions_once_requires_date
      CHECK (recurrence_type != 'once' OR scheduled_date IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_sessions_weekly_requires_weekdays'
  ) THEN
    ALTER TABLE public.scheduled_sessions
      ADD CONSTRAINT scheduled_sessions_weekly_requires_weekdays
      CHECK (recurrence_type != 'weekly' OR weekdays IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workout_template_sets_set_type_check'
  ) THEN
    ALTER TABLE public.workout_template_sets
      ADD CONSTRAINT workout_template_sets_set_type_check
      CHECK (set_type IN ('normal', 'warmup', 'failure'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS workouts_share_token_key
  ON public.workouts (share_token)
  WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS workout_templates_user_id_idx
  ON public.workout_templates (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS workout_template_exercises_template_sort_idx
  ON public.workout_template_exercises (template_id, sort_order);

CREATE INDEX IF NOT EXISTS workout_template_sets_exercise_set_idx
  ON public.workout_template_sets (template_exercise_id, set_index);

CREATE INDEX IF NOT EXISTS workout_templates_source_workout_idx
  ON public.workout_templates (source_workout_id)
  WHERE source_workout_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS scheduled_sessions_user_active_idx
  ON public.scheduled_sessions (user_id, is_active, start_date);

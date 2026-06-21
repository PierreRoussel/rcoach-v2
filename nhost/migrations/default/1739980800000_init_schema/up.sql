-- RCoach v2 initial schema

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'athlete'
    CHECK (role IN ('athlete', 'coach', 'both')),
  unit_system TEXT NOT NULL DEFAULT 'kg'
    CHECK (unit_system IN ('kg', 'lb')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT,
  equipment TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.program_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE public.program_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_day_id UUID NOT NULL REFERENCES public.program_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  sort_order INT NOT NULL DEFAULT 0,
  target_sets INT,
  target_reps TEXT,
  notes TEXT
);

CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_day_id UUID REFERENCES public.program_days(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  sort_order INT NOT NULL DEFAULT 0,
  superset_id INT,
  notes TEXT
);

CREATE TABLE public.sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_index INT NOT NULL,
  set_type TEXT NOT NULL DEFAULT 'normal'
    CHECK (set_type IN ('normal', 'warmup', 'failure')),
  weight_kg NUMERIC(6, 2),
  reps INT,
  distance_km NUMERIC(6, 3),
  duration_seconds INT,
  rpe NUMERIC(3, 1)
);

CREATE TABLE public.coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coach_id, athlete_id)
);

CREATE INDEX workouts_user_started_at_idx ON public.workouts (user_id, started_at DESC);
CREATE INDEX sets_workout_exercise_set_index_idx ON public.sets (workout_exercise_id, set_index);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.display_name, split_part(NEW.email, '@', 1), 'User')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

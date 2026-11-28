ALTER TABLE public.workout_template_exercises DROP COLUMN IF EXISTS equipment;
ALTER TABLE public.workout_exercises DROP COLUMN IF EXISTS equipment;
ALTER TABLE public.program_exercises DROP COLUMN IF EXISTS equipment;
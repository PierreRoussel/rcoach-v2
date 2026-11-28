ALTER TABLE public.workout_template_exercises
  ADD COLUMN IF NOT EXISTS equipment TEXT;

ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS equipment TEXT;

ALTER TABLE public.program_exercises
  ADD COLUMN IF NOT EXISTS equipment TEXT;

UPDATE public.workout_template_exercises AS line
SET equipment = exercise.equipment
FROM public.exercises AS exercise
WHERE exercise.id = line.exercise_id
  AND line.equipment IS NULL;

UPDATE public.workout_exercises AS line
SET equipment = exercise.equipment
FROM public.exercises AS exercise
WHERE exercise.id = line.exercise_id
  AND line.equipment IS NULL;

UPDATE public.program_exercises AS line
SET equipment = exercise.equipment
FROM public.exercises AS exercise
WHERE exercise.id = line.exercise_id
  AND line.equipment IS NULL;

UPDATE public.workout_template_exercises
SET equipment = COALESCE(NULLIF(trim(equipment), ''), 'other')
WHERE equipment IS NULL;

UPDATE public.workout_exercises
SET equipment = COALESCE(NULLIF(trim(equipment), ''), 'other')
WHERE equipment IS NULL;

UPDATE public.program_exercises
SET equipment = COALESCE(NULLIF(trim(equipment), ''), 'other')
WHERE equipment IS NULL;

ALTER TABLE public.workout_template_exercises
  ALTER COLUMN equipment SET NOT NULL;

ALTER TABLE public.workout_exercises
  ALTER COLUMN equipment SET NOT NULL;

ALTER TABLE public.program_exercises
  ALTER COLUMN equipment SET NOT NULL;
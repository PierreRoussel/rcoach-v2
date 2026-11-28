DROP TABLE IF EXISTS public.exercise_merge_map;
ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_equipment_options_valid;
ALTER TABLE public.exercises DROP COLUMN IF EXISTS equipment_options;
DROP FUNCTION IF EXISTS public.exercise_family_key(text, boolean);
DROP FUNCTION IF EXISTS public.strip_exercise_equipment_suffix(text);
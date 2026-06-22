ALTER TABLE public.workout_template_exercises
  ADD COLUMN IF NOT EXISTS default_rest_seconds INT NOT NULL DEFAULT 90;

UPDATE public.workout_template_exercises wte
SET default_rest_seconds = wt.default_rest_seconds
FROM public.workout_templates wt
WHERE wte.template_id = wt.id;

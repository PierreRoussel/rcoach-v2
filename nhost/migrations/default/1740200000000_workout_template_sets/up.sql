CREATE TABLE public.workout_template_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_exercise_id UUID NOT NULL
    REFERENCES public.workout_template_exercises(id) ON DELETE CASCADE,
  set_index INT NOT NULL,
  weight_kg NUMERIC(6, 2),
  reps INT,
  rest_seconds INT NOT NULL DEFAULT 90
);

CREATE INDEX workout_template_sets_exercise_set_idx
  ON public.workout_template_sets (template_exercise_id, set_index);

ALTER TABLE public.workout_templates
  ADD COLUMN IF NOT EXISTS default_rest_seconds INT NOT NULL DEFAULT 90;

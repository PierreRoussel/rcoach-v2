CREATE TABLE public.workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX workout_templates_user_id_idx ON public.workout_templates (user_id, created_at DESC);
CREATE INDEX workout_template_exercises_template_sort_idx
  ON public.workout_template_exercises (template_id, sort_order);

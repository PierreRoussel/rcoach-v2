CREATE TABLE public.weight_goals (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_weight_kg NUMERIC(6, 2) NOT NULL,
  start_weight_kg NUMERIC(6, 2) NOT NULL,
  current_weight_kg NUMERIC(6, 2) NOT NULL,
  goal_type public.nutrition_goal NOT NULL,
  last_milestone_step INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX weight_goals_user_idx ON public.weight_goals (user_id);

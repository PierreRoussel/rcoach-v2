CREATE TABLE public.nutrition_streak_validated_days (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  validated_date DATE NOT NULL,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, validated_date)
);

CREATE INDEX nutrition_streak_validated_days_user_date_idx
  ON public.nutrition_streak_validated_days (user_id, validated_date DESC);

CREATE TABLE public.nutrition_streak_recovery (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  frozen_streak INT NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  started_on DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

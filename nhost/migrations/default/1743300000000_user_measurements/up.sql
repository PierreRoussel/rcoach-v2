CREATE TABLE public.user_measurements (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  sex public.nutrition_sex,
  age INT,
  height_cm NUMERIC(6, 2),
  waist_cm NUMERIC(6, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER user_measurements_updated_at
  BEFORE UPDATE ON public.user_measurements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.user_measurements (user_id, sex, age, height_cm)
SELECT user_id, sex, age, height_cm
FROM public.nutrition_settings
WHERE sex IS NOT NULL
  AND age IS NOT NULL
  AND height_cm IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  sex = EXCLUDED.sex,
  age = EXCLUDED.age,
  height_cm = EXCLUDED.height_cm,
  updated_at = now();

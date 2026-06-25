CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'snack', 'dinner');

CREATE TYPE public.food_source AS ENUM ('user', 'open_food_facts');

CREATE TYPE public.nutrition_sex AS ENUM ('male', 'female');

CREATE TYPE public.nutrition_goal AS ENUM ('lose', 'maintain', 'gain');

CREATE TYPE public.activity_level AS ENUM (
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active'
);

CREATE TABLE public.nutrition_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  daily_calorie_target INT NOT NULL DEFAULT 2000,
  carbs_pct NUMERIC(5, 2) NOT NULL DEFAULT 40,
  protein_pct NUMERIC(5, 2) NOT NULL DEFAULT 30,
  fat_pct NUMERIC(5, 2) NOT NULL DEFAULT 30,
  breakfast_pct NUMERIC(5, 2) NOT NULL DEFAULT 20,
  lunch_pct NUMERIC(5, 2) NOT NULL DEFAULT 35,
  snack_pct NUMERIC(5, 2) NOT NULL DEFAULT 10,
  dinner_pct NUMERIC(5, 2) NOT NULL DEFAULT 35,
  sex public.nutrition_sex,
  age INT,
  height_cm NUMERIC(6, 2),
  weight_kg NUMERIC(6, 2),
  activity_level public.activity_level,
  goal public.nutrition_goal DEFAULT 'maintain',
  calorie_adjustment INT NOT NULL DEFAULT 0,
  tdee_calculated INT,
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  barcode TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  calories NUMERIC(8, 2) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  protein_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  fat_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  salt_g NUMERIC(8, 2),
  sugar_g NUMERIC(8, 2),
  saturated_fat_g NUMERIC(8, 2),
  serving_size_g NUMERIC(8, 2) NOT NULL DEFAULT 100,
  serving_label TEXT NOT NULL DEFAULT '100 g',
  source public.food_source NOT NULL DEFAULT 'user',
  off_product_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT foods_user_or_off CHECK (
    (source = 'user' AND user_id IS NOT NULL)
    OR (source = 'open_food_facts')
  )
);

CREATE TABLE public.food_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, food_id)
);

CREATE TABLE public.meal_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL,
  meal_type public.meal_type NOT NULL,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE RESTRICT,
  quantity_g NUMERIC(8, 2),
  servings NUMERIC(8, 2),
  calories NUMERIC(8, 2) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  protein_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  fat_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT meal_log_quantity_check CHECK (
    (quantity_g IS NOT NULL AND quantity_g > 0 AND servings IS NULL)
    OR (servings IS NOT NULL AND servings > 0 AND quantity_g IS NULL)
  )
);

CREATE INDEX foods_user_id_idx ON public.foods (user_id, name);
CREATE INDEX foods_barcode_idx ON public.foods (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX foods_off_product_id_idx ON public.foods (off_product_id) WHERE off_product_id IS NOT NULL;
CREATE INDEX food_favorites_user_id_idx ON public.food_favorites (user_id, created_at DESC);
CREATE INDEX meal_log_entries_user_date_idx
  ON public.meal_log_entries (user_id, logged_date DESC, meal_type);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nutrition_settings_updated_at
  BEFORE UPDATE ON public.nutrition_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER foods_updated_at
  BEFORE UPDATE ON public.foods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER meal_log_entries_updated_at
  BEFORE UPDATE ON public.meal_log_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

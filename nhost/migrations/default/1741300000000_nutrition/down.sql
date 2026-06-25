DROP TRIGGER IF EXISTS meal_log_entries_updated_at ON public.meal_log_entries;
DROP TRIGGER IF EXISTS foods_updated_at ON public.foods;
DROP TRIGGER IF EXISTS nutrition_settings_updated_at ON public.nutrition_settings;

DROP TABLE IF EXISTS public.meal_log_entries;
DROP TABLE IF EXISTS public.food_favorites;
DROP TABLE IF EXISTS public.foods;
DROP TABLE IF EXISTS public.nutrition_settings;

DROP TYPE IF EXISTS public.meal_type;
DROP TYPE IF EXISTS public.food_source;
DROP TYPE IF EXISTS public.nutrition_sex;
DROP TYPE IF EXISTS public.nutrition_goal;
DROP TYPE IF EXISTS public.activity_level;

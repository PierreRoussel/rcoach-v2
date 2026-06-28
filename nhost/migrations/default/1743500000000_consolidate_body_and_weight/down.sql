ALTER TABLE public.nutrition_settings
  ADD COLUMN IF NOT EXISTS sex public.nutrition_sex,
  ADD COLUMN IF NOT EXISTS age INT,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(6, 2),
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6, 2),
  ADD COLUMN IF NOT EXISTS goal public.nutrition_goal DEFAULT 'maintain';

UPDATE public.nutrition_settings ns
SET
  sex = um.sex,
  age = um.age,
  height_cm = um.height_cm
FROM public.user_measurements um
WHERE um.user_id = ns.user_id;

UPDATE public.nutrition_settings ns
SET weight_kg = latest.weight_kg
FROM (
  SELECT DISTINCT ON (user_id)
    user_id,
    weight_kg
  FROM public.weight_entries
  ORDER BY user_id, logged_at DESC
) latest
WHERE latest.user_id = ns.user_id;

UPDATE public.nutrition_settings ns
SET goal = wg.goal_type
FROM public.weight_goals wg
WHERE wg.user_id = ns.user_id;

ALTER TABLE public.weight_goals
  ADD COLUMN IF NOT EXISTS current_weight_kg NUMERIC(6, 2);

UPDATE public.weight_goals wg
SET current_weight_kg = COALESCE(
  (
    SELECT we.weight_kg
    FROM public.weight_entries we
    WHERE we.user_id = wg.user_id
    ORDER BY we.logged_at DESC
    LIMIT 1
  ),
  wg.start_weight_kg
);

ALTER TABLE public.weight_goals
  ALTER COLUMN current_weight_kg SET NOT NULL;

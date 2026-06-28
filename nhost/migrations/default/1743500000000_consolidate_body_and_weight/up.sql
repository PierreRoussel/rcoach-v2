-- Ensure every user with a weight goal has at least one weight entry
INSERT INTO public.weight_entries (user_id, weight_kg, logged_at, source)
SELECT wg.user_id, wg.current_weight_kg, wg.updated_at, 'migrate'
FROM public.weight_goals wg
WHERE NOT EXISTS (
  SELECT 1 FROM public.weight_entries we WHERE we.user_id = wg.user_id
);

-- Backfill from legacy nutrition weight when no entries exist
INSERT INTO public.weight_entries (user_id, weight_kg, logged_at, source)
SELECT ns.user_id, ns.weight_kg, ns.updated_at, 'migrate'
FROM public.nutrition_settings ns
WHERE ns.weight_kg IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.weight_entries we WHERE we.user_id = ns.user_id
  );

ALTER TABLE public.weight_goals
  DROP COLUMN IF EXISTS current_weight_kg;

ALTER TABLE public.nutrition_settings
  DROP COLUMN IF EXISTS sex,
  DROP COLUMN IF EXISTS age,
  DROP COLUMN IF EXISTS height_cm,
  DROP COLUMN IF EXISTS weight_kg,
  DROP COLUMN IF EXISTS goal;

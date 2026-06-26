DELETE FROM public.meal_log_entries
WHERE food_id IS NULL;

ALTER TABLE public.meal_log_entries
  DROP CONSTRAINT meal_log_entry_source_check;

ALTER TABLE public.meal_log_entries
  DROP COLUMN custom_name;

ALTER TABLE public.meal_log_entries
  ALTER COLUMN food_id SET NOT NULL;

ALTER TABLE public.meal_log_entries
  ADD CONSTRAINT meal_log_quantity_check CHECK (
    (quantity_g IS NOT NULL AND quantity_g > 0 AND servings IS NULL)
    OR (servings IS NOT NULL AND servings > 0 AND quantity_g IS NULL)
  );

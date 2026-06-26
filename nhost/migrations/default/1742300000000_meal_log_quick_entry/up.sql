ALTER TABLE public.meal_log_entries
  DROP CONSTRAINT meal_log_quantity_check;

ALTER TABLE public.meal_log_entries
  ALTER COLUMN food_id DROP NOT NULL;

ALTER TABLE public.meal_log_entries
  ADD COLUMN custom_name TEXT;

ALTER TABLE public.meal_log_entries
  ADD CONSTRAINT meal_log_entry_source_check CHECK (
    (
      food_id IS NOT NULL
      AND custom_name IS NULL
      AND (
        (quantity_g IS NOT NULL AND quantity_g > 0 AND servings IS NULL)
        OR (servings IS NOT NULL AND servings > 0 AND quantity_g IS NULL)
      )
    )
    OR (
      food_id IS NULL
      AND custom_name IS NOT NULL
      AND btrim(custom_name) <> ''
      AND quantity_g IS NULL
      AND servings IS NULL
    )
  );

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS search_text text GENERATED ALWAYS AS (
    lower(btrim(name)) || ' ' || lower(btrim(coalesce(brand, '')))
  ) STORED;

DROP INDEX IF EXISTS public.foods_name_trgm_idx;
DROP INDEX IF EXISTS public.foods_brand_trgm_idx;
DROP INDEX IF EXISTS public.foods_off_product_id_idx;

CREATE INDEX foods_off_search_trgm_idx
  ON public.foods USING gin (search_text gin_trgm_ops)
  WHERE source = 'open_food_facts';

CREATE INDEX foods_user_search_trgm_idx
  ON public.foods USING gin (search_text gin_trgm_ops)
  WHERE user_id IS NOT NULL;

DROP INDEX IF EXISTS public.foods_user_id_idx;

CREATE INDEX foods_user_id_name_idx
  ON public.foods (user_id, name)
  WHERE user_id IS NOT NULL;

CREATE INDEX foods_off_name_prefix_idx
  ON public.foods (name text_pattern_ops)
  WHERE source = 'open_food_facts';

ANALYZE public.foods;

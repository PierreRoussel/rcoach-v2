DROP INDEX IF EXISTS public.foods_off_name_prefix_idx;
DROP INDEX IF EXISTS public.foods_user_id_name_idx;
DROP INDEX IF EXISTS public.foods_user_search_trgm_idx;
DROP INDEX IF EXISTS public.foods_off_search_trgm_idx;

CREATE INDEX IF NOT EXISTS foods_user_id_idx ON public.foods (user_id, name);
CREATE INDEX IF NOT EXISTS foods_off_product_id_idx
  ON public.foods (off_product_id) WHERE off_product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS foods_name_trgm_idx
  ON public.foods USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS foods_brand_trgm_idx
  ON public.foods USING gin (brand gin_trgm_ops)
  WHERE brand IS NOT NULL;

ALTER TABLE public.foods DROP COLUMN IF EXISTS search_text;

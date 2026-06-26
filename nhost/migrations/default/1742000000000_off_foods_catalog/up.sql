CREATE UNIQUE INDEX foods_off_product_id_unique_idx
  ON public.foods (off_product_id)
  WHERE source = 'open_food_facts' AND off_product_id IS NOT NULL;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX foods_name_trgm_idx
  ON public.foods USING gin (name gin_trgm_ops);

CREATE INDEX foods_brand_trgm_idx
  ON public.foods USING gin (brand gin_trgm_ops)
  WHERE brand IS NOT NULL;

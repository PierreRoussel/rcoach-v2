DROP INDEX IF EXISTS public.foods_off_search_trgm_idx;
DROP INDEX IF EXISTS public.foods_user_search_trgm_idx;
DROP INDEX IF EXISTS public.foods_ciqual_search_trgm_idx;

ALTER TABLE public.foods
  DROP COLUMN IF EXISTS search_text;

ALTER TABLE public.foods
  ADD COLUMN search_text text GENERATED ALWAYS AS (
    lower(btrim(name)) || ' ' || lower(btrim(coalesce(brand, '')))
  ) STORED;

CREATE INDEX foods_off_search_trgm_idx
  ON public.foods USING gin (search_text gin_trgm_ops)
  WHERE source = 'open_food_facts';

CREATE INDEX foods_user_search_trgm_idx
  ON public.foods USING gin (search_text gin_trgm_ops)
  WHERE user_id IS NOT NULL;

CREATE INDEX foods_ciqual_search_trgm_idx
  ON public.foods USING gin (search_text gin_trgm_ops)
  WHERE source = 'ciqual';

DROP FUNCTION IF EXISTS public.fold_search_text(text);

ANALYZE public.foods;

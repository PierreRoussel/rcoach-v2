CREATE OR REPLACE FUNCTION public.fold_search_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT lower(
    translate(
      coalesce(input, ''),
      'àâäáãåçèéêëíìîïñòóôöõùúûüýÿÀÂÄÁÃÅÇÈÉÊËÍÌÎÏÑÒÓÔÖÕÙÚÛÜÝ',
      'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY'
    )
  );
$$;

DROP INDEX IF EXISTS public.foods_off_search_trgm_idx;
DROP INDEX IF EXISTS public.foods_user_search_trgm_idx;
DROP INDEX IF EXISTS public.foods_ciqual_search_trgm_idx;

ALTER TABLE public.foods
  DROP COLUMN IF EXISTS search_text;

ALTER TABLE public.foods
  ADD COLUMN search_text text GENERATED ALWAYS AS (
    public.fold_search_text(
      coalesce(name, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(barcode, '')
    )
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

ANALYZE public.foods;

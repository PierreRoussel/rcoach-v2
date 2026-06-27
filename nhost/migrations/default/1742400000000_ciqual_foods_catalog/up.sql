ALTER TYPE public.food_source ADD VALUE IF NOT EXISTS 'ciqual';

ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS ciqual_code text;

ALTER TABLE public.foods
  DROP CONSTRAINT IF EXISTS foods_user_or_off;

ALTER TABLE public.foods
  ADD CONSTRAINT foods_source_identity_check CHECK (
    (
      source = 'user'
      AND user_id IS NOT NULL
    )
    OR (
      source = 'open_food_facts'
      AND user_id IS NULL
    )
    OR (
      source = 'ciqual'
      AND user_id IS NULL
      AND ciqual_code IS NOT NULL
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS foods_ciqual_code_unique_idx
  ON public.foods (ciqual_code)
  WHERE source = 'ciqual' AND ciqual_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS foods_ciqual_search_trgm_idx
  ON public.foods USING gin (search_text gin_trgm_ops)
  WHERE source = 'ciqual';

CREATE INDEX IF NOT EXISTS foods_ciqual_name_prefix_idx
  ON public.foods (name text_pattern_ops)
  WHERE source = 'ciqual';

ANALYZE public.foods;

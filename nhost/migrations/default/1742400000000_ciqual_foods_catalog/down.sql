DROP INDEX IF EXISTS public.foods_ciqual_name_prefix_idx;
DROP INDEX IF EXISTS public.foods_ciqual_search_trgm_idx;
DROP INDEX IF EXISTS public.foods_ciqual_code_unique_idx;

DELETE FROM public.foods WHERE source = 'ciqual';

ALTER TABLE public.foods DROP COLUMN IF EXISTS ciqual_code;

ALTER TABLE public.foods DROP CONSTRAINT IF EXISTS foods_source_identity_check;

ALTER TABLE public.foods
  ADD CONSTRAINT foods_user_or_off CHECK (
    (source = 'user' AND user_id IS NOT NULL)
    OR (source = 'open_food_facts')
  );

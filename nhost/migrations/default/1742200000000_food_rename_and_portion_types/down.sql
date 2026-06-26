DROP TRIGGER IF EXISTS food_rename_proposals_apply_approval ON public.food_rename_proposals;
DROP FUNCTION IF EXISTS public.apply_approved_food_rename();

DROP TRIGGER IF EXISTS food_rename_proposals_updated_at ON public.food_rename_proposals;

DROP TABLE IF EXISTS public.food_portion_types;
DROP TABLE IF EXISTS public.food_rename_proposals;

DROP TYPE IF EXISTS public.food_rename_proposal_status;

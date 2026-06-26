CREATE TYPE public.food_rename_proposal_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.food_rename_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  proposed_name TEXT NOT NULL,
  proposed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.food_rename_proposal_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.food_portion_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  portion_name TEXT NOT NULL,
  portion_size_g NUMERIC(8, 2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX food_rename_proposals_status_idx
  ON public.food_rename_proposals (status, created_at DESC);

CREATE INDEX food_rename_proposals_food_id_idx
  ON public.food_rename_proposals (food_id);

CREATE INDEX food_portion_types_food_id_idx
  ON public.food_portion_types (food_id, created_at DESC);

CREATE TRIGGER food_rename_proposals_updated_at
  BEFORE UPDATE ON public.food_rename_proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.apply_approved_food_rename()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE public.foods
    SET
      name = NEW.proposed_name,
      updated_at = now()
    WHERE id = NEW.food_id;

    NEW.reviewed_at = COALESCE(NEW.reviewed_at, now());
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    NEW.reviewed_at = COALESCE(NEW.reviewed_at, now());
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER food_rename_proposals_apply_approval
  BEFORE UPDATE ON public.food_rename_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_approved_food_rename();

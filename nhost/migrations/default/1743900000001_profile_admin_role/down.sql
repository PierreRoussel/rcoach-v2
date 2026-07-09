UPDATE public.profiles
SET role = 'athlete'
WHERE role = 'admin';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('athlete', 'coach', 'both'));

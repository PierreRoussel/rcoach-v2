-- Revert platform admin promotion for Pierre Roussel.
UPDATE public.profiles
SET role = 'user'
WHERE id = '82ce7100-c48a-486a-944e-711547395f43';

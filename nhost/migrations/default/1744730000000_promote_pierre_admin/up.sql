-- Promote Pierre Roussel to platform admin (deploy-only; no manual SQL on Nhost).
UPDATE public.profiles
SET role = 'admin'
WHERE id = '82ce7100-c48a-486a-944e-711547395f43';

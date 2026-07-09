-- Promote a profile to platform admin (run in Nhost SQL / Hasura Data SQL).
-- Replace the UUID with the target account before executing.

UPDATE public.profiles
SET role = 'admin'
WHERE id = '82ce7100-c48a-486a-944e-711547395f43';

-- Verification
SELECT id, display_name, role, created_at
FROM public.profiles
WHERE id = '82ce7100-c48a-486a-944e-711547395f43';

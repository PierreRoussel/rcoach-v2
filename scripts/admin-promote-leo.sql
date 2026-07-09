-- Promote a profile to platform admin (run in Nhost SQL / Hasura Data SQL).
-- Replace the UUID with the target account before executing.

UPDATE public.profiles
SET role = 'admin'
WHERE id = '91ad5f74-e959-4378-b333-a160196d9c8b';

-- Verification
SELECT id, display_name, role, created_at
FROM public.profiles
WHERE id = '91ad5f74-e959-4378-b333-a160196d9c8b';

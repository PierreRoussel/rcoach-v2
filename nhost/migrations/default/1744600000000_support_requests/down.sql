DROP FUNCTION IF EXISTS public.admin_support_requests(integer);
DROP FUNCTION IF EXISTS public.admin_support_requests_jsonb(integer);

DROP TRIGGER IF EXISTS support_requests_updated_at ON public.support_requests;
DROP FUNCTION IF EXISTS public.support_requests_set_updated_at();

DROP TABLE IF EXISTS public.support_requests;

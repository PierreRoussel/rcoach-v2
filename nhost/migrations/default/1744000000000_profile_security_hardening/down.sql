DROP FUNCTION IF EXISTS public.complete_my_onboarding();

DROP TRIGGER IF EXISTS profiles_protect_sensitive_fields ON public.profiles;

DROP FUNCTION IF EXISTS public.protect_profile_sensitive_fields();

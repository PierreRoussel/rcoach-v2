DROP TABLE IF EXISTS public.friend_motivations;
DROP TABLE IF EXISTS public.friendships;

DROP INDEX IF EXISTS public.profiles_friend_code_key;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS friend_code;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

DROP FUNCTION IF EXISTS public.generate_friend_code();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.display_name, split_part(NEW.email, '@', 1), 'User')
  );
  RETURN NEW;
END;
$$;

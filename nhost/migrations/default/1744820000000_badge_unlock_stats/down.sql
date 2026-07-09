DROP TRIGGER IF EXISTS user_badges_refresh_unlock_stats ON public.user_badges;
DROP FUNCTION IF EXISTS public.on_user_badge_insert_refresh_stats();
DROP FUNCTION IF EXISTS public.refresh_badge_unlock_stats(TEXT);

ALTER TABLE public.badge_definitions
  DROP COLUMN IF EXISTS unlock_percent,
  DROP COLUMN IF EXISTS unlock_count;

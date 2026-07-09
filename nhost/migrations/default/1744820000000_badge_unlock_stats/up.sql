ALTER TABLE public.badge_definitions
  ADD COLUMN unlock_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN unlock_percent NUMERIC(5, 1) NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.refresh_badge_unlock_stats(badge_key_param TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  total_users INTEGER;
  distinct_unlocks INTEGER;
  percent_value NUMERIC(5, 1);
BEGIN
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  IF total_users <= 0 THEN
    total_users := 1;
  END IF;

  SELECT COUNT(DISTINCT user_id)
  INTO distinct_unlocks
  FROM public.user_badges
  WHERE badge_key = badge_key_param;

  percent_value := ROUND((distinct_unlocks::numeric / total_users::numeric) * 100, 1);

  UPDATE public.badge_definitions
  SET
    unlock_count = distinct_unlocks,
    unlock_percent = percent_value
  WHERE key = badge_key_param;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_user_badge_insert_refresh_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.refresh_badge_unlock_stats(NEW.badge_key);
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_badges_refresh_unlock_stats
AFTER INSERT ON public.user_badges
FOR EACH ROW
EXECUTE FUNCTION public.on_user_badge_insert_refresh_stats();

DO $$
DECLARE
  badge_row RECORD;
BEGIN
  FOR badge_row IN SELECT key FROM public.badge_definitions
  LOOP
    PERFORM public.refresh_badge_unlock_stats(badge_row.key);
  END LOOP;
END $$;

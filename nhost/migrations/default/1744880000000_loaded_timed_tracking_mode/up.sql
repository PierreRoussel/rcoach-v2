DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  WHERE con.conrelid = 'public.exercises'::regclass
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%tracking_mode%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.exercises DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_tracking_mode_check
  CHECK (
    tracking_mode IN (
      'auto',
      'weighted',
      'bodyweight',
      'timed',
      'cardio',
      'loaded_timed'
    )
  );

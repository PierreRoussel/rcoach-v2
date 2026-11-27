UPDATE public.exercises
SET tracking_mode = 'timed'
WHERE tracking_mode = 'loaded_timed';

ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_tracking_mode_check;

ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_tracking_mode_check
  CHECK (
    tracking_mode IN (
      'auto',
      'weighted',
      'bodyweight',
      'timed',
      'cardio'
    )
  );

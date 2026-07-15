ALTER TABLE public.workout_templates
  ADD COLUMN session_mode TEXT NOT NULL DEFAULT 'circuit'
    CHECK (session_mode IN ('circuit', 'emom')),
  ADD COLUMN emom_interval_seconds INT NULL,
  ADD COLUMN emom_total_minutes INT NULL;

ALTER TABLE public.workout_template_exercises
  ADD COLUMN target_reps INT NULL,
  ADD COLUMN emom_group_id INT NULL;

ALTER TABLE public.workouts
  ADD COLUMN session_mode TEXT NOT NULL DEFAULT 'circuit'
    CHECK (session_mode IN ('circuit', 'emom'));

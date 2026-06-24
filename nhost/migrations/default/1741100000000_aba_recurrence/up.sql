ALTER TABLE public.scheduled_sessions
  ADD COLUMN IF NOT EXISTS workout_template_id_b UUID
    REFERENCES public.workout_templates(id) ON DELETE SET NULL;

ALTER TABLE public.scheduled_sessions
  DROP CONSTRAINT IF EXISTS scheduled_sessions_recurrence_type_check;

ALTER TABLE public.scheduled_sessions
  ADD CONSTRAINT scheduled_sessions_recurrence_type_check
  CHECK (recurrence_type IN ('once', 'weekly', 'aba'));

ALTER TABLE public.scheduled_sessions
  DROP CONSTRAINT IF EXISTS scheduled_sessions_weekly_requires_weekdays;

ALTER TABLE public.scheduled_sessions
  ADD CONSTRAINT scheduled_sessions_recurring_requires_weekdays
  CHECK (recurrence_type NOT IN ('weekly', 'aba') OR weekdays IS NOT NULL);

ALTER TABLE public.scheduled_sessions
  DROP CONSTRAINT IF EXISTS scheduled_sessions_aba_requires_templates;

ALTER TABLE public.scheduled_sessions
  ADD CONSTRAINT scheduled_sessions_aba_requires_templates
  CHECK (
    recurrence_type != 'aba'
    OR (
      workout_template_id IS NOT NULL
      AND workout_template_id_b IS NOT NULL
      AND workout_template_id <> workout_template_id_b
    )
  );

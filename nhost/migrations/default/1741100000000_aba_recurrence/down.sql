ALTER TABLE public.scheduled_sessions
  DROP CONSTRAINT IF EXISTS scheduled_sessions_aba_requires_templates;

ALTER TABLE public.scheduled_sessions
  DROP CONSTRAINT IF EXISTS scheduled_sessions_recurring_requires_weekdays;

ALTER TABLE public.scheduled_sessions
  ADD CONSTRAINT scheduled_sessions_weekly_requires_weekdays
  CHECK (recurrence_type != 'weekly' OR weekdays IS NOT NULL);

ALTER TABLE public.scheduled_sessions
  DROP CONSTRAINT IF EXISTS scheduled_sessions_recurrence_type_check;

ALTER TABLE public.scheduled_sessions
  ADD CONSTRAINT scheduled_sessions_recurrence_type_check
  CHECK (recurrence_type IN ('once', 'weekly'));

ALTER TABLE public.scheduled_sessions
  DROP COLUMN IF EXISTS workout_template_id_b;

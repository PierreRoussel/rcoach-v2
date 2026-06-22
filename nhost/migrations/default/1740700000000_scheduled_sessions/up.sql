CREATE TABLE public.scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  workout_template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  recurrence_type TEXT NOT NULL DEFAULT 'once'
    CHECK (recurrence_type IN ('once', 'weekly')),
  weekdays SMALLINT[] NULL,
  scheduled_date DATE NULL,
  time_local TIME NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scheduled_sessions_once_requires_date
    CHECK (recurrence_type != 'once' OR scheduled_date IS NOT NULL),
  CONSTRAINT scheduled_sessions_weekly_requires_weekdays
    CHECK (recurrence_type != 'weekly' OR weekdays IS NOT NULL)
);

CREATE INDEX scheduled_sessions_user_active_idx
  ON public.scheduled_sessions (user_id, is_active, start_date);

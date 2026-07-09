ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goal_coaching_reminders_enabled boolean NOT NULL DEFAULT true;

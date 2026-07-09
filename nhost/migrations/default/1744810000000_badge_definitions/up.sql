CREATE TABLE public.badge_definitions (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('discipline', 'records', 'volume', 'sessions')),
  tier TEXT NOT NULL
    CHECK (tier IN ('bronze', 'silver', 'gold')),
  icon_name TEXT NOT NULL DEFAULT 'medal',
  rule_type TEXT NOT NULL
    CHECK (rule_type IN (
      'nutrition_streak',
      'workout_streak',
      'sessions',
      'pr_count',
      'volume_kg',
      'manual'
    )),
  rule_threshold NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT badge_definitions_manual_no_threshold
    CHECK (
      (rule_type = 'manual' AND rule_threshold IS NULL)
      OR (rule_type <> 'manual' AND rule_threshold IS NOT NULL)
    )
);

CREATE INDEX badge_definitions_active_sort_idx
  ON public.badge_definitions (is_active, sort_order, key);

INSERT INTO public.badge_definitions (
  key, label, description, category, tier, icon_name, rule_type, rule_threshold, sort_order
) VALUES
  ('nutrition_streak_7', 'Semaine diète', '7 jours de nutrition validés d''affilée.', 'discipline', 'bronze', 'utensils', 'nutrition_streak', 7, 10),
  ('nutrition_streak_30', 'Mois diète', '30 jours de nutrition validés d''affilée.', 'discipline', 'silver', 'utensils', 'nutrition_streak', 30, 20),
  ('nutrition_streak_100', 'Centurion diète', '100 jours de nutrition validés d''affilée.', 'discipline', 'gold', 'utensils', 'nutrition_streak', 100, 30),
  ('workout_streak_4', 'Mois actif', '4 semaines consécutives avec au moins une séance.', 'discipline', 'bronze', 'flame', 'workout_streak', 4, 40),
  ('workout_streak_12', 'Trimestre actif', '12 semaines consécutives avec au moins une séance.', 'discipline', 'silver', 'flame', 'workout_streak', 12, 50),
  ('workout_streak_52', 'Année active', '52 semaines consécutives avec au moins une séance.', 'discipline', 'gold', 'flame', 'workout_streak', 52, 60),
  ('sessions_10', 'Débutant motivé', '10 séances terminées.', 'sessions', 'bronze', 'dumbbell', 'sessions', 10, 70),
  ('sessions_50', 'Régulier', '50 séances terminées.', 'sessions', 'silver', 'dumbbell', 'sessions', 50, 80),
  ('sessions_100', 'Centurion sport', '100 séances terminées.', 'sessions', 'gold', 'dumbbell', 'sessions', 100, 90),
  ('sessions_365', 'Machine', '365 séances terminées.', 'sessions', 'gold', 'medal', 'sessions', 365, 100),
  ('first_pr', 'Premier record', 'Un premier record personnel battu.', 'records', 'bronze', 'trophy', 'pr_count', 1, 110),
  ('pr_10', 'Chasseur de PR', '10 records personnels au total.', 'records', 'silver', 'trophy', 'pr_count', 10, 120),
  ('pr_50', 'Légende des PR', '50 records personnels au total.', 'records', 'gold', 'trophy', 'pr_count', 50, 130),
  ('volume_10k', '10 000 kg', '10 000 kg de volume cumulé.', 'volume', 'bronze', 'dumbbell', 'volume_kg', 10000, 140),
  ('volume_100k', '100 000 kg', '100 000 kg de volume cumulé.', 'volume', 'silver', 'dumbbell', 'volume_kg', 100000, 150),
  ('volume_1m', 'Millionnaire', '1 000 000 kg de volume cumulé.', 'volume', 'gold', 'medal', 'volume_kg', 1000000, 160)
ON CONFLICT (key) DO NOTHING;

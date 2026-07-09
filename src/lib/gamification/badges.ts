import {
  Dumbbell,
  Flame,
  Medal,
  Trophy,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

export type BadgeTier = 'bronze' | 'silver' | 'gold'
export type BadgeCategory = 'discipline' | 'records' | 'volume' | 'sessions'

export type BadgeKey =
  | 'nutrition_streak_7'
  | 'nutrition_streak_30'
  | 'nutrition_streak_100'
  | 'workout_streak_4'
  | 'workout_streak_12'
  | 'workout_streak_52'
  | 'sessions_10'
  | 'sessions_50'
  | 'sessions_100'
  | 'sessions_365'
  | 'first_pr'
  | 'pr_10'
  | 'pr_50'
  | 'volume_10k'
  | 'volume_100k'
  | 'volume_1m'

export type BadgeDefinition = {
  key: BadgeKey
  label: string
  description: string
  category: BadgeCategory
  tier: BadgeTier
  icon: LucideIcon
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    key: 'nutrition_streak_7',
    label: 'Semaine diète',
    description: '7 jours de nutrition validés d’affilée.',
    category: 'discipline',
    tier: 'bronze',
    icon: UtensilsCrossed,
  },
  {
    key: 'nutrition_streak_30',
    label: 'Mois diète',
    description: '30 jours de nutrition validés d’affilée.',
    category: 'discipline',
    tier: 'silver',
    icon: UtensilsCrossed,
  },
  {
    key: 'nutrition_streak_100',
    label: 'Centurion diète',
    description: '100 jours de nutrition validés d’affilée.',
    category: 'discipline',
    tier: 'gold',
    icon: UtensilsCrossed,
  },
  {
    key: 'workout_streak_4',
    label: 'Mois actif',
    description: '4 semaines consécutives avec au moins une séance.',
    category: 'discipline',
    tier: 'bronze',
    icon: Flame,
  },
  {
    key: 'workout_streak_12',
    label: 'Trimestre actif',
    description: '12 semaines consécutives avec au moins une séance.',
    category: 'discipline',
    tier: 'silver',
    icon: Flame,
  },
  {
    key: 'workout_streak_52',
    label: 'Année active',
    description: '52 semaines consécutives avec au moins une séance.',
    category: 'discipline',
    tier: 'gold',
    icon: Flame,
  },
  {
    key: 'sessions_10',
    label: 'Débutant motivé',
    description: '10 séances terminées.',
    category: 'sessions',
    tier: 'bronze',
    icon: Dumbbell,
  },
  {
    key: 'sessions_50',
    label: 'Régulier',
    description: '50 séances terminées.',
    category: 'sessions',
    tier: 'silver',
    icon: Dumbbell,
  },
  {
    key: 'sessions_100',
    label: 'Centurion sport',
    description: '100 séances terminées.',
    category: 'sessions',
    tier: 'gold',
    icon: Dumbbell,
  },
  {
    key: 'sessions_365',
    label: 'Machine',
    description: '365 séances terminées.',
    category: 'sessions',
    tier: 'gold',
    icon: Medal,
  },
  {
    key: 'first_pr',
    label: 'Premier record',
    description: 'Un premier record personnel battu.',
    category: 'records',
    tier: 'bronze',
    icon: Trophy,
  },
  {
    key: 'pr_10',
    label: 'Chasseur de PR',
    description: '10 records personnels au total.',
    category: 'records',
    tier: 'silver',
    icon: Trophy,
  },
  {
    key: 'pr_50',
    label: 'Légende des PR',
    description: '50 records personnels au total.',
    category: 'records',
    tier: 'gold',
    icon: Trophy,
  },
  {
    key: 'volume_10k',
    label: '10 000 kg',
    description: '10 000 kg de volume cumulé.',
    category: 'volume',
    tier: 'bronze',
    icon: Dumbbell,
  },
  {
    key: 'volume_100k',
    label: '100 000 kg',
    description: '100 000 kg de volume cumulé.',
    category: 'volume',
    tier: 'silver',
    icon: Dumbbell,
  },
  {
    key: 'volume_1m',
    label: 'Millionnaire',
    description: '1 000 000 kg de volume cumulé.',
    category: 'volume',
    tier: 'gold',
    icon: Medal,
  },
]

const BADGE_BY_KEY = new Map(BADGE_CATALOG.map((badge) => [badge.key, badge]))

export function getBadgeDefinition(key: string): BadgeDefinition | undefined {
  return BADGE_BY_KEY.get(key as BadgeKey)
}

export const BADGE_TIER_CLASSES: Record<BadgeTier, string> = {
  bronze: 'border-amber-700/40 bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  silver: 'border-slate-400/50 bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-100',
  gold: 'border-amber-300/60 bg-gradient-to-br from-amber-300 to-yellow-400 text-amber-950',
}

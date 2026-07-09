import {
  Crown,
  Dumbbell,
  Flame,
  Medal,
  Sparkles,
  Star,
  Target,
  Trophy,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export type BadgeTier = 'bronze' | 'silver' | 'gold'
export type BadgeCategory = 'discipline' | 'records' | 'volume' | 'sessions'
export type BadgeRuleType =
  | 'nutrition_streak'
  | 'workout_streak'
  | 'sessions'
  | 'pr_count'
  | 'volume_kg'
  | 'manual'

export type BadgeDefinitionRecord = {
  key: string
  label: string
  description: string
  category: BadgeCategory
  tier: BadgeTier
  icon_name: string
  rule_type: BadgeRuleType
  rule_threshold: number | null
  is_active: boolean
  sort_order: number
  unlock_count?: number
  unlock_percent?: number
  created_at?: string
  updated_at?: string
}

export type BadgeDefinition = Omit<BadgeDefinitionRecord, 'icon_name'> & {
  icon: LucideIcon
}

export const BADGE_ICON_OPTIONS = [
  { value: 'dumbbell', label: 'Haltère' },
  { value: 'flame', label: 'Flamme' },
  { value: 'medal', label: 'Médaille' },
  { value: 'trophy', label: 'Trophée' },
  { value: 'utensils', label: 'Nutrition' },
  { value: 'sparkles', label: 'Étoiles' },
  { value: 'star', label: 'Étoile' },
  { value: 'crown', label: 'Couronne' },
  { value: 'target', label: 'Cible' },
  { value: 'zap', label: 'Éclair' },
] as const

const BADGE_ICONS: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  flame: Flame,
  medal: Medal,
  trophy: Trophy,
  utensils: UtensilsCrossed,
  sparkles: Sparkles,
  star: Star,
  crown: Crown,
  target: Target,
  zap: Zap,
}

export const BADGE_CATEGORY_OPTIONS: Array<{ value: BadgeCategory; label: string }> = [
  { value: 'discipline', label: 'Discipline' },
  { value: 'sessions', label: 'Séances' },
  { value: 'records', label: 'Records' },
  { value: 'volume', label: 'Volume' },
]

export const BADGE_TIER_OPTIONS: Array<{ value: BadgeTier; label: string }> = [
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Argent' },
  { value: 'gold', label: 'Or' },
]

export const BADGE_RULE_OPTIONS: Array<{
  value: BadgeRuleType
  label: string
  description: string
  needsThreshold: boolean
}> = [
  {
    value: 'nutrition_streak',
    label: 'Streak nutrition (jours)',
    description: 'Jours consécutifs de nutrition validée',
    needsThreshold: true,
  },
  {
    value: 'workout_streak',
    label: 'Streak sport (semaines)',
    description: 'Semaines consécutives avec au moins une séance',
    needsThreshold: true,
  },
  {
    value: 'sessions',
    label: 'Nombre de séances',
    description: 'Séances terminées au total',
    needsThreshold: true,
  },
  {
    value: 'pr_count',
    label: 'Records personnels',
    description: 'Nombre total de PR battus',
    needsThreshold: true,
  },
  {
    value: 'volume_kg',
    label: 'Volume cumulé (kg)',
    description: 'Volume total soulevé (kg × reps)',
    needsThreshold: true,
  },
  {
    value: 'manual',
    label: 'Manuelle',
    description: 'Attribuée uniquement à la main (admin)',
    needsThreshold: false,
  },
]

/** Catalogue embarqué si la table n'est pas encore déployée. */
export const FALLBACK_BADGE_CATALOG: BadgeDefinitionRecord[] = [
  {
    key: 'nutrition_streak_7',
    label: 'Semaine diète',
    description: '7 jours de nutrition validés d’affilée.',
    category: 'discipline',
    tier: 'bronze',
    icon_name: 'utensils',
    rule_type: 'nutrition_streak',
    rule_threshold: 7,
    is_active: true,
    sort_order: 10,
  },
  {
    key: 'nutrition_streak_30',
    label: 'Mois diète',
    description: '30 jours de nutrition validés d’affilée.',
    category: 'discipline',
    tier: 'silver',
    icon_name: 'utensils',
    rule_type: 'nutrition_streak',
    rule_threshold: 30,
    is_active: true,
    sort_order: 20,
  },
  {
    key: 'nutrition_streak_100',
    label: 'Centurion diète',
    description: '100 jours de nutrition validés d’affilée.',
    category: 'discipline',
    tier: 'gold',
    icon_name: 'utensils',
    rule_type: 'nutrition_streak',
    rule_threshold: 100,
    is_active: true,
    sort_order: 30,
  },
  {
    key: 'workout_streak_4',
    label: 'Mois actif',
    description: '4 semaines consécutives avec au moins une séance.',
    category: 'discipline',
    tier: 'bronze',
    icon_name: 'flame',
    rule_type: 'workout_streak',
    rule_threshold: 4,
    is_active: true,
    sort_order: 40,
  },
  {
    key: 'workout_streak_12',
    label: 'Trimestre actif',
    description: '12 semaines consécutives avec au moins une séance.',
    category: 'discipline',
    tier: 'silver',
    icon_name: 'flame',
    rule_type: 'workout_streak',
    rule_threshold: 12,
    is_active: true,
    sort_order: 50,
  },
  {
    key: 'workout_streak_52',
    label: 'Année active',
    description: '52 semaines consécutives avec au moins une séance.',
    category: 'discipline',
    tier: 'gold',
    icon_name: 'flame',
    rule_type: 'workout_streak',
    rule_threshold: 52,
    is_active: true,
    sort_order: 60,
  },
  {
    key: 'sessions_10',
    label: 'Débutant motivé',
    description: '10 séances terminées.',
    category: 'sessions',
    tier: 'bronze',
    icon_name: 'dumbbell',
    rule_type: 'sessions',
    rule_threshold: 10,
    is_active: true,
    sort_order: 70,
  },
  {
    key: 'sessions_50',
    label: 'Régulier',
    description: '50 séances terminées.',
    category: 'sessions',
    tier: 'silver',
    icon_name: 'dumbbell',
    rule_type: 'sessions',
    rule_threshold: 50,
    is_active: true,
    sort_order: 80,
  },
  {
    key: 'sessions_100',
    label: 'Centurion sport',
    description: '100 séances terminées.',
    category: 'sessions',
    tier: 'gold',
    icon_name: 'dumbbell',
    rule_type: 'sessions',
    rule_threshold: 100,
    is_active: true,
    sort_order: 90,
  },
  {
    key: 'sessions_365',
    label: 'Machine',
    description: '365 séances terminées.',
    category: 'sessions',
    tier: 'gold',
    icon_name: 'medal',
    rule_type: 'sessions',
    rule_threshold: 365,
    is_active: true,
    sort_order: 100,
  },
  {
    key: 'first_pr',
    label: 'Premier record',
    description: 'Un premier record personnel battu.',
    category: 'records',
    tier: 'bronze',
    icon_name: 'trophy',
    rule_type: 'pr_count',
    rule_threshold: 1,
    is_active: true,
    sort_order: 110,
  },
  {
    key: 'pr_10',
    label: 'Chasseur de PR',
    description: '10 records personnels au total.',
    category: 'records',
    tier: 'silver',
    icon_name: 'trophy',
    rule_type: 'pr_count',
    rule_threshold: 10,
    is_active: true,
    sort_order: 120,
  },
  {
    key: 'pr_50',
    label: 'Légende des PR',
    description: '50 records personnels au total.',
    category: 'records',
    tier: 'gold',
    icon_name: 'trophy',
    rule_type: 'pr_count',
    rule_threshold: 50,
    is_active: true,
    sort_order: 130,
  },
  {
    key: 'volume_10k',
    label: '10 000 kg',
    description: '10 000 kg de volume cumulé.',
    category: 'volume',
    tier: 'bronze',
    icon_name: 'dumbbell',
    rule_type: 'volume_kg',
    rule_threshold: 10_000,
    is_active: true,
    sort_order: 140,
  },
  {
    key: 'volume_100k',
    label: '100 000 kg',
    description: '100 000 kg de volume cumulé.',
    category: 'volume',
    tier: 'silver',
    icon_name: 'dumbbell',
    rule_type: 'volume_kg',
    rule_threshold: 100_000,
    is_active: true,
    sort_order: 150,
  },
  {
    key: 'volume_1m',
    label: 'Millionnaire',
    description: '1 000 000 kg de volume cumulé.',
    category: 'volume',
    tier: 'gold',
    icon_name: 'medal',
    rule_type: 'volume_kg',
    rule_threshold: 1_000_000,
    is_active: true,
    sort_order: 160,
  },
]

export function resolveBadgeIcon(iconName: string): LucideIcon {
  return BADGE_ICONS[iconName] ?? Medal
}

export function mapBadgeRecordToDefinition(record: BadgeDefinitionRecord): BadgeDefinition {
  return {
    key: record.key,
    label: record.label,
    description: record.description,
    category: record.category,
    tier: record.tier,
    rule_type: record.rule_type,
    rule_threshold: record.rule_threshold,
    is_active: record.is_active,
    sort_order: record.sort_order,
    unlock_count: record.unlock_count ?? 0,
    unlock_percent: Number(record.unlock_percent ?? 0),
    created_at: record.created_at,
    updated_at: record.updated_at,
    icon: resolveBadgeIcon(record.icon_name),
  }
}

export function getBadgeDefinitionFromCatalog(
  key: string,
  catalog: BadgeDefinitionRecord[],
): BadgeDefinition | undefined {
  const record = catalog.find((badge) => badge.key === key)
  return record ? mapBadgeRecordToDefinition(record) : undefined
}

/** Résout un badge via le catalogue embarqué (fallback hors API). */
export function getBadgeDefinition(key: string): BadgeDefinition | undefined {
  return getBadgeDefinitionFromCatalog(key, FALLBACK_BADGE_CATALOG)
}

export function normalizeBadgeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export const BADGE_TIER_CLASSES: Record<BadgeTier, string> = {
  bronze: 'border-amber-700/40 bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  silver: 'border-slate-400/50 bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-100',
  gold: 'border-amber-300/60 bg-gradient-to-br from-amber-300 to-yellow-400 text-amber-950',
}

export function formatBadgeRule(record: Pick<BadgeDefinitionRecord, 'rule_type' | 'rule_threshold'>) {
  if (record.rule_type === 'manual') {
    return 'Manuelle'
  }

  const threshold = Number(record.rule_threshold ?? 0)
  switch (record.rule_type) {
    case 'nutrition_streak':
      return `≥ ${threshold} j nutrition`
    case 'workout_streak':
      return `≥ ${threshold} sem. sport`
    case 'sessions':
      return `≥ ${threshold} séances`
    case 'pr_count':
      return `≥ ${threshold} PR`
    case 'volume_kg':
      return `≥ ${threshold.toLocaleString('fr-FR')} kg`
    default:
      return '—'
  }
}

export function describeBadgeUnlockCondition(
  record: Pick<BadgeDefinitionRecord, 'rule_type' | 'rule_threshold'>,
): string {
  if (record.rule_type === 'manual') {
    return 'Cette médaille est attribuée manuellement par l’équipe RCoach.'
  }

  const threshold = Number(record.rule_threshold ?? 0)
  switch (record.rule_type) {
    case 'nutrition_streak':
      return `Validez votre nutrition ${threshold} jour${threshold > 1 ? 's' : ''} d’affilée.`
    case 'workout_streak':
      return `Terminez au moins une séance chaque semaine pendant ${threshold} semaine${threshold > 1 ? 's' : ''} consécutive${threshold > 1 ? 's' : ''}.`
    case 'sessions':
      return `Terminez ${threshold} séance${threshold > 1 ? 's' : ''} au total.`
    case 'pr_count':
      return `Battez ${threshold} record${threshold > 1 ? 's' : ''} personnel${threshold > 1 ? 's' : ''} (PR).`
    case 'volume_kg':
      return `Cumulez ${threshold.toLocaleString('fr-FR')} kg de volume soulevé (poids × répétitions).`
    default:
      return BADGE_RULE_OPTIONS.find((option) => option.value === record.rule_type)?.description ?? '—'
  }
}

export function getBadgeCategoryLabel(category: BadgeCategory) {
  return BADGE_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category
}

export function getBadgeTierLabel(tier: BadgeTier) {
  return BADGE_TIER_OPTIONS.find((option) => option.value === tier)?.label ?? tier
}

export function formatBadgeUnlockPercent(percent: number) {
  return `${percent.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
}

export function formatBadgeUnlockStat(percent: number) {
  return `Débloquée par ${formatBadgeUnlockPercent(percent)} des utilisateurs`
}

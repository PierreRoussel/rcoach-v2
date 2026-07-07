import type { PlanTier } from '@/lib/subscription/plans'

export type PremiumFeature =
  | 'overload_suggestions'
  | 'advanced_stats'
  | 'unlimited_history'
  | 'unlimited_planning'
  | 'ai_advice'
  | 'premium_themes'
  | 'pro_badge'

export type SubscriptionTier = PlanTier

export const FREE_HISTORY_WEEKS = 4
export const FREE_ACTIVE_PROGRAMS = 1
export const FREE_OVERLOAD_ADVICE_PER_DAY = 1

const PREMIUM_FEATURES = new Set<PremiumFeature>([
  'overload_suggestions',
  'advanced_stats',
  'unlimited_history',
  'unlimited_planning',
  'ai_advice',
  'premium_themes',
  'pro_badge',
])

export function isPremiumTier(tier: SubscriptionTier): boolean {
  return tier === 'premium'
}

export function hasEntitlement(tier: SubscriptionTier, feature: PremiumFeature): boolean {
  if (!PREMIUM_FEATURES.has(feature)) {
    return false
  }

  return isPremiumTier(tier)
}

export function isPremiumTheme(themeId: string): boolean {
  return themeId === 'pro'
}

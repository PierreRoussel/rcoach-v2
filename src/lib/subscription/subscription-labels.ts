import type { SubscriptionStatus } from '@/lib/graphql/operations'
import type { BillingPeriod, PlanTier } from '@/lib/subscription/plans'

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Actif',
  trialing: 'Essai gratuit',
  canceled: 'Résilié',
  past_due: 'Paiement en attente',
}

export function subscriptionTierLabel(tier: PlanTier): string {
  return tier === 'premium' ? 'Premium' : 'Gratuit'
}

export function billingPeriodLabel(period: BillingPeriod): string {
  return period === 'annual' ? 'Annuel' : 'Mensuel'
}

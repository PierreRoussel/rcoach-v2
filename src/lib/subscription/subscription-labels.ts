import type { Subscription } from '@/lib/graphql/operations'
import type { BillingPeriod } from '@/lib/subscription/plans'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

import type { SubscriptionStatus } from '@/lib/graphql/operations'
import type { PlanTier } from '@/lib/subscription/plans'

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Actif',
  trialing: 'Premium',
  canceled: 'Résilié',
  past_due: 'Paiement en attente',
}

export function subscriptionTierLabel(tier: PlanTier): string {
  return tier === 'premium' ? 'Premium' : 'Gratuit'
}

export function billingPeriodLabel(period: BillingPeriod): string {
  return period === 'annual' ? 'Annuel' : 'Mensuel'
}

type SubscriptionDisplayInput = Pick<
  Subscription,
  'tier' | 'status' | 'billing_period' | 'current_period_end'
>

export function subscriptionDisplayStatus(
  subscription: SubscriptionDisplayInput,
): {
  tierLabel: string
  statusLabel: string
  billingLabel: string | null
  periodContext: string | null
} {
  const isPremiumPlan =
    subscription.tier === 'premium' &&
    (subscription.status === 'active' || subscription.status === 'trialing')

  const periodEnd = subscription.current_period_end
    ? format(new Date(subscription.current_period_end), 'd MMMM yyyy', { locale: fr })
    : null

  const periodContext =
    isPremiumPlan && periodEnd
      ? subscription.status === 'trialing'
        ? `Se termine le ${periodEnd}`
        : `Renouvellement le ${periodEnd}`
      : null

  return {
    tierLabel: subscriptionTierLabel(subscription.tier),
    statusLabel: isPremiumPlan ? 'Premium' : SUBSCRIPTION_STATUS_LABELS[subscription.status],
    billingLabel: subscription.billing_period
      ? billingPeriodLabel(subscription.billing_period)
      : null,
    periodContext,
  }
}

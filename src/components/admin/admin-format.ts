import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

import type { SubscriptionStatus } from '@/lib/graphql/operations'
import {
  billingPeriodLabel,
  SUBSCRIPTION_STATUS_LABELS,
  subscriptionTierLabel,
} from '@/lib/subscription/subscription-labels'
import type { BillingPeriod } from '@/lib/subscription/plans'

export function formatAdminDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  try {
    return format(parseISO(value), 'd MMM yyyy HH:mm', { locale: fr })
  } catch {
    return value
  }
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  try {
    return format(parseISO(value), 'd MMM yyyy', { locale: fr })
  } catch {
    return value
  }
}

const PROFILE_ROLE_LABELS: Record<string, string> = {
  athlete: 'Athlète',
  coach: 'Coach',
  both: 'Athlète + coach',
  admin: 'Admin',
}

export function formatProfileRole(role: string): string {
  return PROFILE_ROLE_LABELS[role] ?? role
}

export function formatSubscriptionTier(tier: string): string {
  return subscriptionTierLabel(tier === 'premium' ? 'premium' : 'free')
}

export function formatSubscriptionStatus(status: string): string {
  if (status in SUBSCRIPTION_STATUS_LABELS) {
    return SUBSCRIPTION_STATUS_LABELS[status as SubscriptionStatus]
  }

  return status
}

export function formatBillingPeriod(period: string | null): string {
  if (period === 'monthly' || period === 'annual') {
    return billingPeriodLabel(period as BillingPeriod)
  }

  return '—'
}

export function formatPlanTier(tier: string): string {
  return formatSubscriptionTier(tier)
}

import { differenceInCalendarDays, parseISO } from 'date-fns'

import type { Subscription, SubscriptionUpdateInput } from '@/lib/graphql/operations'
import type { BillingPeriod } from '@/lib/subscription/plans'

export type TrialMilestone = 'j5' | 'j2' | 'expired' | null

export function getTrialDaysLeft(
  currentPeriodEnd: string | null | undefined,
  now = new Date(),
): number | null {
  if (!currentPeriodEnd) {
    return null
  }

  const end = parseISO(currentPeriodEnd)
  if (Number.isNaN(end.getTime())) {
    return null
  }

  return differenceInCalendarDays(end, now)
}

export function isSubscriptionPeriodActive(
  subscription: Pick<Subscription, 'tier' | 'status' | 'current_period_end'>,
  now = new Date(),
): boolean {
  if (subscription.tier !== 'premium') {
    return false
  }

  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return false
  }

  if (!subscription.current_period_end) {
    return subscription.status === 'active'
  }

  const end = parseISO(subscription.current_period_end)
  if (Number.isNaN(end.getTime())) {
    return subscription.status === 'active'
  }

  return end.getTime() > now.getTime()
}

export function shouldExpireTrial(
  subscription: Pick<Subscription, 'status' | 'current_period_end'>,
  now = new Date(),
): boolean {
  if (subscription.status !== 'trialing' || !subscription.current_period_end) {
    return false
  }

  const end = parseISO(subscription.current_period_end)
  if (Number.isNaN(end.getTime())) {
    return false
  }

  return end.getTime() <= now.getTime()
}

export function buildTrialDowngradePatch(): SubscriptionUpdateInput {
  return {
    tier: 'free',
    status: 'canceled',
    billing_period: null,
    current_period_end: null,
    provider: 'none',
    provider_ref: null,
  }
}

export function resolveTrialMilestone(
  subscription: Pick<Subscription, 'status' | 'current_period_end' | 'tier'>,
  now = new Date(),
): TrialMilestone {
  if (subscription.status !== 'trialing') {
    return null
  }

  const daysLeft = getTrialDaysLeft(subscription.current_period_end, now)
  if (daysLeft == null) {
    return null
  }

  if (daysLeft <= 0) {
    return null
  }

  if (daysLeft <= 2) {
    return 'j2'
  }

  if (daysLeft <= 5) {
    return 'j5'
  }

  return null
}

export const TRIAL_LAST_ENDED_STORAGE_KEY = 'trial-last-ended-at'

export function markTrialEndedPeriod(periodEnd: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(TRIAL_LAST_ENDED_STORAGE_KEY, periodEnd)
}

export function readTrialEndedPeriod(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(TRIAL_LAST_ENDED_STORAGE_KEY)
}

export function shouldShowTrialExpiredNotice(periodEnd: string | null): boolean {
  if (!periodEnd) {
    return false
  }

  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(trialReminderStorageKey('expired', periodEnd)) !== '1'
}

export function dismissTrialExpiredNotice(periodEnd: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(trialReminderStorageKey('expired', periodEnd), '1')
}

export function trialReminderStorageKey(milestone: 'j5' | 'j2' | 'expired', periodEnd: string) {
  return `trial-reminder:${milestone}:${periodEnd}`
}

export function trialNotificationOpenedStorageKey(periodEnd: string) {
  return `trial-notification-opened:${periodEnd}`
}

export function buildTrialUpgradeSearch(billingPeriod: BillingPeriod | null | undefined) {
  return {
    intent: 'upgrade' as const,
    billingPeriod: billingPeriod ?? ('annual' as const),
  }
}

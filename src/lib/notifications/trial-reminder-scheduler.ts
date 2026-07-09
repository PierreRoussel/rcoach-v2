import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { addDays, setHours, setMinutes, setSeconds } from 'date-fns'

import type { BillingPeriod } from '@/lib/subscription/plans'

const TRIAL_J5_PREFIX = 'trial-j5:'
const TRIAL_J2_PREFIX = 'trial-j2:'

function notificationIdForKey(key: string): number {
  let hash = 0
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0
  }

  return 10_000 + (hash % 1_000_000)
}

function scheduleAtLocalHour(date: Date, hour = 10): Date {
  return setSeconds(setMinutes(setHours(date, hour), 0), 0)
}

function buildNotificationKey(prefix: string, periodEnd: string) {
  return `${prefix}${periodEnd}`
}

export async function scheduleTrialReminderNotifications(input: {
  periodEnd: string
  billingPeriod: BillingPeriod | null
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  const permission = await LocalNotifications.checkPermissions()
  if (permission.display !== 'granted') {
    return
  }

  const periodEnd = new Date(input.periodEnd)
  if (Number.isNaN(periodEnd.getTime())) {
    return
  }

  const j5Date = scheduleAtLocalHour(addDays(periodEnd, -5))
  const j2Date = scheduleAtLocalHour(addDays(periodEnd, -2))
  const now = new Date()

  const notifications = [] as Array<{
    id: number
    title: string
    body: string
    schedule: { at: Date }
    extra?: Record<string, string>
  }>

  const billingPeriod = input.billingPeriod ?? 'annual'
  const extra = {
    route: '/app/profile/subscription',
    intent: 'upgrade',
    billingPeriod,
  }

  if (j5Date.getTime() > now.getTime()) {
    const key = buildNotificationKey(TRIAL_J5_PREFIX, input.periodEnd)
    notifications.push({
      id: notificationIdForKey(key),
      title: 'Essai Premium bientôt terminé',
      body: 'Votre essai Premium se termine dans 5 jours.',
      schedule: { at: j5Date },
      extra,
    })
  }

  if (j2Date.getTime() > now.getTime()) {
    const key = buildNotificationKey(TRIAL_J2_PREFIX, input.periodEnd)
    notifications.push({
      id: notificationIdForKey(key),
      title: 'Plus que 2 jours',
      body: 'Plus que 2 jours — conservez vos avantages Premium.',
      schedule: { at: j2Date },
      extra,
    })
  }

  if (notifications.length === 0) {
    return
  }

  await LocalNotifications.schedule({ notifications })
}

export async function cancelTrialReminderNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  const pending = await LocalNotifications.getPending()
  const trialIds = pending.notifications
    .filter((notification) => notification.id >= 10_000)
    .map((notification) => ({ id: notification.id }))

  if (trialIds.length === 0) {
    return
  }

  await LocalNotifications.cancel({ notifications: trialIds })
}

export function markTrialNotificationOpened(periodEnd: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(`trial-notification-opened:${periodEnd}`, new Date().toISOString())
}

export function wasTrialNotificationOpenedToday(periodEnd: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const openedAt = window.localStorage.getItem(`trial-notification-opened:${periodEnd}`)
  if (!openedAt) {
    return false
  }

  const openedDate = new Date(openedAt)
  const now = new Date()
  return openedDate.toDateString() === now.toDateString()
}

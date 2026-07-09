import { useEffect, useMemo, useState } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useNavigate } from '@tanstack/react-router'

import { TrialExpiredOverlay } from '@/components/subscription/TrialExpiredOverlay'
import { TrialReminderOverlay } from '@/components/subscription/TrialReminderOverlay'
import { useNotificationPermissions } from '@/hooks/useNotificationPermissions'
import {
  useReconcileTrialExpiry,
  useSubscriptionSummary,
} from '@/hooks/useSubscription'
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates'
import { useMyWorkouts } from '@/hooks/useWorkouts'
import { trackEvent } from '@/lib/analytics/track-event'
import {
  markTrialNotificationOpened,
  scheduleTrialReminderNotifications,
  wasTrialNotificationOpenedToday,
} from '@/lib/notifications/trial-reminder-scheduler'
import {
  countTemplateUsageFromWorkouts,
  rankTemplatesByUsage,
  resolveFrozenTemplateIds,
} from '@/lib/subscription/template-access'
import {
  dismissTrialExpiredNotice,
  readTrialEndedPeriod,
  resolveTrialMilestone,
  shouldShowTrialExpiredNotice,
  trialReminderStorageKey,
} from '@/lib/subscription/trial-lifecycle'

type OverlayKind = 'expired' | 'j2' | 'j5' | null

function readDismissed(key: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(key) === '1'
}

function writeDismissed(key: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, '1')
}

export function SubscriptionLifecycleProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useReconcileTrialExpiry()

  const navigate = useNavigate()
  const { subscription, isPremium, isLoading, billingPeriod } = useSubscriptionSummary()
  const { permission, requestPermission } = useNotificationPermissions()
  const needsFrozenTemplateAudit = useMemo(() => {
    if (isLoading || !subscription) {
      return false
    }

    if (subscription.status === 'trialing') {
      return true
    }

    const endedPeriod = readTrialEndedPeriod()
    return Boolean(
      endedPeriod && shouldShowTrialExpiredNotice(endedPeriod) && !isPremium,
    )
  }, [isLoading, isPremium, subscription])
  const { data: templates } = useWorkoutTemplates({
    enabled: needsFrozenTemplateAudit,
  })
  const { data: workouts = [] } = useMyWorkouts({
    enabled: needsFrozenTemplateAudit,
  })
  const [overlay, setOverlay] = useState<OverlayKind>(null)
  const [notificationPrompted, setNotificationPrompted] = useState(false)

  const frozenIds = useMemo(() => {
    if (!templates) {
      return new Set<string>()
    }

    const usage = countTemplateUsageFromWorkouts(workouts)
    const ranked = rankTemplatesByUsage(templates, usage)
    return resolveFrozenTemplateIds(ranked, isPremium)
  }, [isPremium, templates, workouts])

  useEffect(() => {
    if (isLoading || !subscription) {
      return
    }

    const periodEnd = subscription.current_period_end
    const endedPeriod = readTrialEndedPeriod()

    let nextOverlay: OverlayKind = null

    if (
      endedPeriod &&
      shouldShowTrialExpiredNotice(endedPeriod) &&
      !isPremium
    ) {
      nextOverlay = 'expired'
    } else if (subscription.status === 'trialing' && periodEnd) {
      if (wasTrialNotificationOpenedToday(periodEnd)) {
        setOverlay(null)
        return
      }

      const milestone = resolveTrialMilestone(subscription)
      if (milestone === 'j2' && !readDismissed(trialReminderStorageKey('j2', periodEnd))) {
        nextOverlay = 'j2'
      } else if (milestone === 'j5' && !readDismissed(trialReminderStorageKey('j5', periodEnd))) {
        nextOverlay = 'j5'
      }
    }

    setOverlay(nextOverlay)
  }, [isLoading, isPremium, subscription])

  useEffect(() => {
    if (
      isLoading ||
      subscription?.status !== 'trialing' ||
      !subscription.current_period_end
    ) {
      return
    }

    if (permission === 'granted') {
      void scheduleTrialReminderNotifications({
        periodEnd: subscription.current_period_end,
        billingPeriod: subscription.billing_period,
      })
      return
    }

    if (
      permission === 'prompt' &&
      !notificationPrompted &&
      Capacitor.isNativePlatform()
    ) {
      setNotificationPrompted(true)
      void requestPermission().then((granted) => {
        if (granted && subscription.current_period_end) {
          void scheduleTrialReminderNotifications({
            periodEnd: subscription.current_period_end,
            billingPeriod: subscription.billing_period,
          })
        }
      })
    }
  }, [
    isLoading,
    notificationPrompted,
    permission,
    requestPermission,
    subscription,
  ])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return
    }

    const listener = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (event) => {
        const extra = event.notification.extra as
          | { route?: string; intent?: string; billingPeriod?: string }
          | undefined

        if (subscription?.current_period_end) {
          markTrialNotificationOpened(subscription.current_period_end)
        }

        if (extra?.route === '/app/profile/subscription') {
          void navigate({
            to: '/app/profile/subscription',
            search: {
              intent: extra.intent === 'upgrade' ? 'upgrade' : undefined,
              billingPeriod:
                extra.billingPeriod === 'monthly' || extra.billingPeriod === 'annual'
                  ? extra.billingPeriod
                  : undefined,
            },
          })
        }
      },
    )

    const appListener = App.addListener('appUrlOpen', () => {
      if (subscription?.current_period_end) {
        markTrialNotificationOpened(subscription.current_period_end)
      }
    })

    return () => {
      void listener.then((handle) => handle.remove())
      void appListener.then((handle) => handle.remove())
    }
  }, [navigate, subscription?.current_period_end])

  function dismissOverlay() {
    if (!subscription) {
      setOverlay(null)
      return
    }

    if (overlay === 'expired') {
      const endedPeriod = readTrialEndedPeriod()
      if (endedPeriod) {
        dismissTrialExpiredNotice(endedPeriod)
      }
    } else if (overlay && subscription.current_period_end) {
      writeDismissed(trialReminderStorageKey(overlay, subscription.current_period_end))
      trackEvent('trial_reminder_dismiss', { variant: overlay })
    }

    setOverlay(null)
  }

  return (
    <>
      {children}
      {overlay === 'j5' && subscription?.current_period_end ? (
        <TrialReminderOverlay
          open
          variant="j5"
          periodEnd={subscription.current_period_end}
          billingPeriod={billingPeriod}
          onDismiss={dismissOverlay}
        />
      ) : null}
      {overlay === 'j2' && subscription?.current_period_end ? (
        <TrialReminderOverlay
          open
          variant="j2"
          periodEnd={subscription.current_period_end}
          billingPeriod={billingPeriod}
          onDismiss={dismissOverlay}
        />
      ) : null}
      {overlay === 'expired' ? (
        <TrialExpiredOverlay
          open
          templateCount={templates?.length ?? 0}
          frozenCount={frozenIds.size}
          onDismiss={dismissOverlay}
        />
      ) : null}
    </>
  )
}

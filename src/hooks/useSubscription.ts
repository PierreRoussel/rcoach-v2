import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addDays } from 'date-fns'
import { useEffect, useRef } from 'react'

import type {
  CancellationFeedbackInput,
  Subscription,
  SubscriptionUpdateInput,
} from '@/lib/graphql/operations'
import {
  fetchMySubscription,
  submitCancellationFeedback,
  updateMySubscription,
} from '@/lib/graphql/subscription-request'
import { isPremiumTier } from '@/lib/subscription/entitlements'
import type { PremiumFeature } from '@/lib/subscription/entitlements'
import type { BillingPeriod } from '@/lib/subscription/plans'
import { PREMIUM_PLAN } from '@/lib/subscription/plans'
import {
  canStartPremiumTrial,
  canSubscribeToPremiumOffer,
  hasConsumedPremiumTrial,
  isTrialAlreadyConsumedError,
} from '@/lib/subscription/trial-eligibility'
import {
  buildTrialDowngradePatch,
  isSubscriptionPeriodActive,
  markTrialEndedPeriod,
  shouldExpireTrial,
} from '@/lib/subscription/trial-lifecycle'
import { cancelTrialReminderNotifications, scheduleTrialReminderNotifications } from '@/lib/notifications/trial-reminder-scheduler'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useSubscription() {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['subscription', 'me', userId],
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 5 * 60_000,
    queryFn: () => fetchMySubscription(nhost, userId!),
  })
}

export function useSubscriptionSummary() {
  const query = useSubscription()
  const subscription = query.data

  const tier = subscription?.tier ?? 'free'
  const status = subscription?.status ?? 'active'
  const isPremium = subscription
    ? isSubscriptionPeriodActive(subscription)
    : false
  const isPastDue = status === 'past_due'
  const billingPeriod = subscription?.billing_period ?? null
  const trialConsumedAt = subscription?.trial_consumed_at ?? null
  const hasConsumedTrial = hasConsumedPremiumTrial(trialConsumedAt)
  const canStartTrial = canStartPremiumTrial({
    isPremium,
    trialConsumedAt,
  })

  return {
    ...query,
    subscription,
    tier,
    status,
    billingPeriod,
    isPremium,
    isPastDue,
    trialConsumedAt,
    hasConsumedTrial,
    canStartTrial,
    currentPeriodEnd: subscription?.current_period_end ?? null,
  }
}

export function useEntitlement(feature: PremiumFeature) {
  const { isPremium, isLoading } = useSubscriptionSummary()
  return { entitled: isPremium, isPremium, isLoading, feature }
}

export function useReconcileTrialExpiry() {
  const { subscription, isLoading } = useSubscriptionSummary()
  const updateSubscription = useUpdateSubscription()
  const reconcilingRef = useRef(false)

  useEffect(() => {
    if (isLoading || !subscription?.id || reconcilingRef.current) {
      return
    }

    if (!shouldExpireTrial(subscription)) {
      return
    }

    reconcilingRef.current = true
    const periodEnd = subscription.current_period_end

  void (async () => {
      try {
        if (periodEnd) {
          markTrialEndedPeriod(periodEnd)
        }
        await updateSubscription.mutateAsync(buildTrialDowngradePatch())
        await cancelTrialReminderNotifications()
      } finally {
        reconcilingRef.current = false
      }
    })()
  }, [isLoading, subscription, updateSubscription])
}

export function useUpdateSubscription() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  return useMutation({
    mutationFn: (changes: SubscriptionUpdateInput) => {
      if (!userId) {
        throw new Error('Utilisateur non connecté.')
      }
      return updateMySubscription(nhost, userId, changes)
    },
    onSuccess: (subscription: Subscription) => {
      queryClient.setQueryData(['subscription', 'me', userId], subscription)
      void queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
      void queryClient.invalidateQueries({ queryKey: ['friendships'] })
      void queryClient.invalidateQueries({ queryKey: ['friend-recap'] })
      void queryClient.invalidateQueries({ queryKey: ['friend-motivations'] })
    },
  })
}

export function useStartPremiumTrial() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  return useMutation({
    mutationFn: async (input: {
      billingPeriod: BillingPeriod
      trialDays?: number
      subscribeOffer?: boolean
    }) => {
      const { billingPeriod, trialDays, subscribeOffer = false } = input
      if (!userId) {
        throw new Error('Utilisateur non connecté.')
      }

      const subscription = await fetchMySubscription(nhost, userId)
      const isPremium = isSubscriptionPeriodActive(subscription)

      if (subscribeOffer) {
        if (!canSubscribeToPremiumOffer({ isPremium })) {
          throw new Error('Premium déjà actif.')
        }
      } else if (
        !canStartPremiumTrial({
          isPremium,
          trialConsumedAt: subscription.trial_consumed_at,
        })
      ) {
        throw new Error('Vous avez déjà utilisé votre essai gratuit.')
      }

      const trialEnd = addDays(
        new Date(),
        trialDays ?? PREMIUM_PLAN.trialDays,
      ).toISOString()

      try {
        return await updateMySubscription(nhost, userId, {
          tier: 'premium',
          status: 'trialing',
          billing_period: billingPeriod,
          current_period_end: trialEnd,
          provider: 'none',
        })
      } catch (error) {
        if (isTrialAlreadyConsumedError(error)) {
          throw new Error('Vous avez déjà utilisé votre essai gratuit.')
        }
        throw error
      }
    },
    onSuccess: (subscription: Subscription) => {
      if (!userId) {
        return
      }

      queryClient.setQueryData(['subscription', 'me', userId], subscription)
      void queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
      void queryClient.invalidateQueries({ queryKey: ['friendships'] })
      void queryClient.invalidateQueries({ queryKey: ['friend-recap'] })
      void queryClient.invalidateQueries({ queryKey: ['friend-motivations'] })
      if (subscription.status === 'trialing' && subscription.current_period_end) {
        void scheduleTrialReminderNotifications({
          periodEnd: subscription.current_period_end,
          billingPeriod: subscription.billing_period,
        })
      }
    },
  })
}

export function useCancelSubscription() {
  const updateSubscription = useUpdateSubscription()

  return useMutation({
    mutationFn: async () =>
      updateSubscription.mutateAsync({
        tier: 'free',
        status: 'canceled',
        billing_period: null,
        current_period_end: null,
        provider: 'none',
        provider_ref: null,
      }),
  })
}

export function useSubmitCancellationFeedback() {
  const { nhost } = useAuth()

  return useMutation({
    mutationFn: (input: CancellationFeedbackInput) =>
      submitCancellationFeedback(nhost, input),
  })
}

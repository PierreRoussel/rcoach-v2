import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import type {
  CancellationFeedbackInput,
  Subscription,
} from '@/lib/graphql/operations'
import {
  cancelMySubscription,
  fetchMySubscription,
  startMyPremiumTrial,
  submitCancellationFeedback,
} from '@/lib/graphql/subscription-request'
import {
  openSubscriptionManagement,
  purchasePremium,
  restorePremiumPurchases,
} from '@/lib/billing/billing-service'
import { isBillingAvailable } from '@/lib/billing/billing-channel'
import type { PremiumFeature } from '@/lib/subscription/entitlements'
import type { BillingPeriod } from '@/lib/subscription/plans'
import {
  canStartPremiumTrial,
  canSubscribeToPremiumOffer,
  isTrialAlreadyConsumedError,
} from '@/lib/subscription/trial-eligibility'
import {
  isSubscriptionPeriodActive,
  markTrialEndedPeriod,
  shouldExpireTrial,
} from '@/lib/subscription/trial-lifecycle'
import { cancelTrialReminderNotifications, scheduleTrialReminderNotifications } from '@/lib/notifications/trial-reminder-scheduler'
import { useAuth } from '@/lib/nhost/AuthProvider'

function invalidateSubscriptionQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
) {
  if (!userId) {
    return
  }

  void queryClient.invalidateQueries({ queryKey: ['subscription', 'me', userId] })
  void queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
  void queryClient.invalidateQueries({ queryKey: ['friendships'] })
  void queryClient.invalidateQueries({ queryKey: ['friend-recap'] })
  void queryClient.invalidateQueries({ queryKey: ['friend-motivations'] })
}

function applySubscriptionCache(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  subscription: Subscription,
) {
  if (!userId) {
    return
  }

  queryClient.setQueryData(['subscription', 'me', userId], subscription)
  invalidateSubscriptionQueries(queryClient, userId)
}

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
  const hasConsumedTrial = trialConsumedAt != null
  const canStartTrial = canStartPremiumTrial({
    isPremium,
    trialConsumedAt,
  })
  const provider = subscription?.provider ?? 'none'
  const isBillingManaged = provider === 'play' || provider === 'stripe'

  return {
    ...query,
    subscription,
    tier,
    status,
    billingPeriod,
    provider,
    isPremium,
    isPastDue,
    isBillingManaged,
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
  const { nhost, user } = useAuth()
  const { subscription, isLoading } = useSubscriptionSummary()
  const queryClient = useQueryClient()
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
        await fetchMySubscription(nhost, user!.id)
        invalidateSubscriptionQueries(queryClient, user?.id)
        await cancelTrialReminderNotifications()
      } finally {
        reconcilingRef.current = false
      }
    })()
  }, [isLoading, nhost, queryClient, subscription, user])
}

export function useStartPremiumTrial() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  return useMutation({
    mutationFn: async (input: { billingPeriod: BillingPeriod }) => {
      if (!userId) {
        throw new Error('Utilisateur non connecté.')
      }

      const subscription = await fetchMySubscription(nhost, userId)
      const isPremium = isSubscriptionPeriodActive(subscription)

      if (
        !canStartPremiumTrial({
          isPremium,
          trialConsumedAt: subscription.trial_consumed_at,
        })
      ) {
        throw new Error('Vous avez déjà utilisé votre essai gratuit.')
      }

      try {
        return await startMyPremiumTrial(nhost, input.billingPeriod)
      } catch (error) {
        if (isTrialAlreadyConsumedError(error)) {
          throw new Error('Vous avez déjà utilisé votre essai gratuit.')
        }
        throw error
      }
    },
    onSuccess: (subscription: Subscription) => {
      applySubscriptionCache(queryClient, userId, subscription)
      if (subscription.status === 'trialing' && subscription.current_period_end) {
        void scheduleTrialReminderNotifications({
          periodEnd: subscription.current_period_end,
          billingPeriod: subscription.billing_period,
        })
      }
    },
  })
}

export function usePurchasePremium() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  return useMutation({
    mutationFn: async (input: { billingPeriod: BillingPeriod }) => {
      if (!userId) {
        throw new Error('Utilisateur non connecté.')
      }

      if (!isBillingAvailable()) {
        throw new Error('Achat indisponible sur cette plateforme.')
      }

      const subscription = await fetchMySubscription(nhost, userId)
      if (!canSubscribeToPremiumOffer({ isPremium: isSubscriptionPeriodActive(subscription) })) {
        throw new Error('Premium déjà actif.')
      }

      await purchasePremium(nhost, input.billingPeriod)
    },
    onSuccess: () => {
      invalidateSubscriptionQueries(queryClient, userId)
    },
  })
}

export function useRestorePremiumPurchases() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('Utilisateur non connecté.')
      }

      if (!isBillingAvailable()) {
        throw new Error('Restauration indisponible sur cette plateforme.')
      }

      await restorePremiumPurchases(nhost)
    },
    onSuccess: () => {
      invalidateSubscriptionQueries(queryClient, userId)
    },
  })
}

export function useOpenSubscriptionManagement() {
  const { nhost } = useAuth()

  return useMutation({
    mutationFn: async (provider: 'play' | 'stripe') => {
      await openSubscriptionManagement(nhost, provider)
    },
  })
}

export function useCancelSubscription() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('Utilisateur non connecté.')
      }

      return cancelMySubscription(nhost)
    },
    onSuccess: (subscription: Subscription) => {
      applySubscriptionCache(queryClient, userId, subscription)
      void cancelTrialReminderNotifications()
    },
  })
}

export function useSubmitCancellationFeedback() {
  const { nhost } = useAuth()

  return useMutation({
    mutationFn: (input: CancellationFeedbackInput) =>
      submitCancellationFeedback(nhost, input),
  })
}

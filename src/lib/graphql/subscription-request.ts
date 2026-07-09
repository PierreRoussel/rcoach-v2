import type { NhostClient } from '@nhost/nhost-js'

import {
  GET_MY_SUBSCRIPTION,
  INSERT_CANCELLATION_FEEDBACK,
  INSERT_MY_SUBSCRIPTION,
  RECONCILE_MY_SUBSCRIPTION,
  UPDATE_MY_SUBSCRIPTION,
  type CancellationFeedbackInput,
  type Subscription,
  type SubscriptionUpdateInput,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  isGraphqlCancellationFeedbackMissingError,
  isGraphqlSubscriptionMissingError,
  toSubscriptionDeployError,
} from '@/lib/graphql/schema-errors'

export const DEFAULT_FREE_SUBSCRIPTION: Subscription = {
  id: '',
  user_id: '',
  tier: 'free',
  status: 'active',
  billing_period: null,
  current_period_end: null,
  provider: 'none',
  provider_ref: null,
  trial_consumed_at: null,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
}

function isSubscriptionSchemaError(error: unknown): boolean {
  return isGraphqlSubscriptionMissingError(error)
}

export async function fetchMySubscription(
  nhost: NhostClient,
  userId: string,
): Promise<Subscription> {
  try {
    const reconciled = await graphqlRequest<{
      reconcile_my_subscription: Subscription[]
    }>(nhost, RECONCILE_MY_SUBSCRIPTION)
    const subscription = reconciled.reconcile_my_subscription[0]
    if (subscription) {
      return subscription
    }

    const data = await graphqlRequest<{ subscriptions: Subscription[] }>(
      nhost,
      GET_MY_SUBSCRIPTION,
      { userId },
    )
    const fallback = data.subscriptions[0]
    return fallback ?? { ...DEFAULT_FREE_SUBSCRIPTION, user_id: userId }
  } catch (error) {
    if (isSubscriptionSchemaError(error)) {
      try {
        const data = await graphqlRequest<{ subscriptions: Subscription[] }>(
          nhost,
          GET_MY_SUBSCRIPTION,
          { userId },
        )
        const subscription = data.subscriptions[0]
        return subscription ?? { ...DEFAULT_FREE_SUBSCRIPTION, user_id: userId }
      } catch (fallbackError) {
        if (isSubscriptionSchemaError(fallbackError)) {
          return { ...DEFAULT_FREE_SUBSCRIPTION, user_id: userId }
        }
        throw fallbackError
      }
    }
    throw error
  }
}

export async function updateMySubscription(
  nhost: NhostClient,
  userId: string,
  changes: SubscriptionUpdateInput,
): Promise<Subscription> {
  try {
    const existing = await fetchMySubscription(nhost, userId)

    if (!existing.id) {
      const inserted = await graphqlRequest<{ insert_subscriptions_one: Subscription | null }>(
        nhost,
        INSERT_MY_SUBSCRIPTION,
        {
          object: changes,
        },
      )

      if (!inserted.insert_subscriptions_one) {
        throw new Error('Impossible de créer l’abonnement.')
      }

      return inserted.insert_subscriptions_one
    }

    const updated = await graphqlRequest<{
      update_subscriptions_by_pk: Subscription | null
    }>(
      nhost,
      UPDATE_MY_SUBSCRIPTION,
      {
        id: existing.id,
        changes,
      },
    )

    if (!updated.update_subscriptions_by_pk) {
      const refetched = await fetchMySubscription(nhost, userId)
      if (!refetched.id) {
        const inserted = await graphqlRequest<{ insert_subscriptions_one: Subscription | null }>(
          nhost,
          INSERT_MY_SUBSCRIPTION,
          {
            object: changes,
          },
        )

        if (!inserted.insert_subscriptions_one) {
          throw new Error('Impossible de mettre à jour l’abonnement.')
        }

        return inserted.insert_subscriptions_one
      }

      throw new Error('Impossible de mettre à jour l’abonnement.')
    }

    return updated.update_subscriptions_by_pk
  } catch (error) {
    throw toSubscriptionDeployError(error)
  }
}

export async function submitCancellationFeedback(
  nhost: NhostClient,
  input: CancellationFeedbackInput,
): Promise<void> {
  try {
    await graphqlRequest(nhost, INSERT_CANCELLATION_FEEDBACK, { object: input })
  } catch (error) {
    if (isGraphqlCancellationFeedbackMissingError(error)) {
      return
    }

    throw error
  }
}

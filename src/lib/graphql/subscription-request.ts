import type { NhostClient } from '@nhost/nhost-js'

import {
  GET_MY_SUBSCRIPTION,
  INSERT_CANCELLATION_FEEDBACK,
  INSERT_MY_SUBSCRIPTION,
  UPDATE_MY_SUBSCRIPTION,
  type CancellationFeedbackInput,
  type Subscription,
  type SubscriptionUpdateInput,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'

export const DEFAULT_FREE_SUBSCRIPTION: Subscription = {
  id: '',
  user_id: '',
  tier: 'free',
  status: 'active',
  billing_period: null,
  current_period_end: null,
  provider: 'none',
  provider_ref: null,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
}

function isSubscriptionSchemaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('subscriptions') || message.includes('subscription')
}

export async function fetchMySubscription(
  nhost: NhostClient,
  userId: string,
): Promise<Subscription> {
  try {
    const data = await graphqlRequest<{ subscriptions: Subscription[] }>(
      nhost,
      GET_MY_SUBSCRIPTION,
      { userId },
    )
    const subscription = data.subscriptions[0]
    return subscription ?? { ...DEFAULT_FREE_SUBSCRIPTION, user_id: userId }
  } catch (error) {
    if (isSubscriptionSchemaError(error)) {
      return { ...DEFAULT_FREE_SUBSCRIPTION, user_id: userId }
    }
    throw error
  }
}

export async function updateMySubscription(
  nhost: NhostClient,
  userId: string,
  changes: SubscriptionUpdateInput,
): Promise<Subscription> {
  const existing = await fetchMySubscription(nhost, userId)

  if (!existing.id) {
    const inserted = await graphqlRequest<{ insert_subscriptions_one: Subscription }>(
      nhost,
      INSERT_MY_SUBSCRIPTION,
      {
        object: {
          user_id: userId,
          ...changes,
        },
      },
    )
    return inserted.insert_subscriptions_one
  }

  const updated = await graphqlRequest<{ update_subscriptions_by_pk: Subscription }>(
    nhost,
    UPDATE_MY_SUBSCRIPTION,
    {
      id: existing.id,
      changes,
    },
  )

  return updated.update_subscriptions_by_pk
}

export async function submitCancellationFeedback(
  nhost: NhostClient,
  input: CancellationFeedbackInput,
): Promise<void> {
  await graphqlRequest(nhost, INSERT_CANCELLATION_FEEDBACK, { object: input })
}

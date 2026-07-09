import { graphqlAdminRequest } from '../_exercise/hasura.ts'

export type BillingPeriod = 'monthly' | 'annual'

export type SubscriptionProvider = 'none' | 'play' | 'stripe'

export type SubscriptionRow = {
  id: string
  user_id: string
  tier: string
  status: string
  billing_period: BillingPeriod | null
  current_period_end: string | null
  provider: SubscriptionProvider
  provider_ref: string | null
}

export function readStripeSecretKey(): string {
  const value = process.env.STRIPE_SECRET_KEY?.trim()
  if (!value) {
    throw new Error('Missing STRIPE_SECRET_KEY.')
  }

  return value
}

export function readStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null
}

export function readStripePriceId(billingPeriod: BillingPeriod): string {
  const key =
    billingPeriod === 'annual'
      ? process.env.STRIPE_PRICE_ANNUAL
      : process.env.STRIPE_PRICE_MONTHLY
  const value = key?.trim()
  if (!value) {
    throw new Error(`Missing Stripe price for ${billingPeriod}.`)
  }

  return value
}

export function readPlayPackageName(): string {
  return process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim() || 'com.rcoach.app'
}

export async function applyBillingSubscription(input: {
  userId: string
  tier: 'free' | 'premium'
  status: 'active' | 'trialing' | 'canceled' | 'past_due'
  billingPeriod: BillingPeriod | null
  currentPeriodEnd: string | null
  provider: SubscriptionProvider
  providerRef: string | null
}): Promise<SubscriptionRow> {
  const data = await graphqlAdminRequest<{
    apply_billing_subscription: SubscriptionRow[]
  }>(
    `mutation ApplyBillingSubscription(
      $userId: uuid!
      $tier: String!
      $status: String!
      $billingPeriod: String
      $currentPeriodEnd: timestamptz
      $provider: String!
      $providerRef: String
    ) {
      apply_billing_subscription(
        args: {
          p_user_id: $userId
          p_tier: $tier
          p_status: $status
          p_billing_period: $billingPeriod
          p_current_period_end: $currentPeriodEnd
          p_provider: $provider
          p_provider_ref: $providerRef
        }
      ) {
        id
        user_id
        tier
        status
        billing_period
        current_period_end
        provider
        provider_ref
      }
    }`,
    {
      userId: input.userId,
      tier: input.tier,
      status: input.status,
      billingPeriod: input.billingPeriod,
      currentPeriodEnd: input.currentPeriodEnd,
      provider: input.provider,
      providerRef: input.providerRef,
    },
  )

  const row = data.apply_billing_subscription[0]
  if (!row) {
    throw new Error('Unable to persist subscription.')
  }

  return row
}

export async function fetchSubscriptionByProviderRef(
  provider: SubscriptionProvider,
  providerRef: string,
): Promise<SubscriptionRow | null> {
  const data = await graphqlAdminRequest<{
    subscriptions: SubscriptionRow[]
  }>(
    `query SubscriptionByProviderRef($provider: String!, $providerRef: String!) {
      subscriptions(
        where: { provider: { _eq: $provider }, provider_ref: { _eq: $providerRef } }
        limit: 1
      ) {
        id
        user_id
        tier
        status
        billing_period
        current_period_end
        provider
        provider_ref
      }
    }`,
    { provider, providerRef },
  )

  return data.subscriptions[0] ?? null
}

export async function fetchSubscriptionByUserId(
  userId: string,
): Promise<SubscriptionRow | null> {
  const data = await graphqlAdminRequest<{
    subscriptions: SubscriptionRow[]
  }>(
    `query SubscriptionByUserId($userId: uuid!) {
      subscriptions(where: { user_id: { _eq: $userId } }, limit: 1) {
        id
        user_id
        tier
        status
        billing_period
        current_period_end
        provider
        provider_ref
      }
    }`,
    { userId },
  )

  return data.subscriptions[0] ?? null
}

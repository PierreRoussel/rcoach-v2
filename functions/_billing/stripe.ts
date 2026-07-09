import { readStripeSecretKey } from './subscription.ts'

type StripeResponse<T> = T & {
  error?: { message?: string }
}

async function stripeRequest<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const secretKey = readStripeSecretKey()
  const body = new URLSearchParams(params)

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const payload = (await response.json()) as StripeResponse<T>
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Stripe error (${response.status}).`)
  }

  return payload
}

export async function createCheckoutSession(input: {
  userId: string
  customerId?: string | null
  priceId: string
  successUrl: string
  cancelUrl: string
}): Promise<{ id: string; url: string | null }> {
  const params: Record<string, string> = {
    mode: 'subscription',
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.userId,
    'line_items[0][price]': input.priceId,
    'line_items[0][quantity]': '1',
    'subscription_data[metadata][userId]': input.userId,
    'metadata[userId]': input.userId,
    allow_promotion_codes: 'true',
  }

  if (input.customerId) {
    params.customer = input.customerId
  } else {
    params['customer_creation'] = 'always'
  }

  return stripeRequest('/checkout/sessions', params)
}

export async function createBillingPortalSession(input: {
  customerId: string
  returnUrl: string
}): Promise<{ url: string }> {
  return stripeRequest('/billing_portal/sessions', {
    customer: input.customerId,
    return_url: input.returnUrl,
  })
}

export type StripeSubscription = {
  id: string
  status: string
  current_period_end: number
  customer?: string
  metadata?: Record<string, string>
  items?: { data?: Array<{ price?: { recurring?: { interval?: string } } }> }
}

export async function retrieveSubscription(subscriptionId: string): Promise<StripeSubscription> {
  const secretKey = readStripeSecretKey()
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  })

  const payload = (await response.json()) as StripeResponse<StripeSubscription>

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Stripe subscription error (${response.status}).`)
  }

  return payload
}

export async function resolveStripeCustomerId(
  providerRef: string | null | undefined,
): Promise<string | null> {
  if (!providerRef) {
    return null
  }

  if (providerRef.startsWith('cus_')) {
    return providerRef
  }

  if (providerRef.startsWith('sub_')) {
    const subscription = await retrieveSubscription(providerRef)
    return typeof subscription.customer === 'string' ? subscription.customer : null
  }

  return null
}

export function billingPeriodFromStripeInterval(
  interval: string | undefined,
): 'monthly' | 'annual' | null {
  if (interval === 'month') {
    return 'monthly'
  }

  if (interval === 'year') {
    return 'annual'
  }

  return null
}

export function mapStripeSubscriptionStatus(
  status: string,
): 'active' | 'trialing' | 'canceled' | 'past_due' {
  if (status === 'trialing') {
    return 'trialing'
  }

  if (status === 'past_due' || status === 'unpaid') {
    return 'past_due'
  }

  if (status === 'canceled' || status === 'incomplete_expired') {
    return 'canceled'
  }

  return 'active'
}

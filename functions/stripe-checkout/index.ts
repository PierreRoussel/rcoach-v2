import {
  readBearerToken,
  readJsonBody,
  readUserIdFromAccessToken,
} from '../_billing/auth.ts'
import {
  billingPeriodFromStripeInterval,
  createCheckoutSession,
  mapStripeSubscriptionStatus,
  retrieveSubscription,
} from '../_billing/stripe.ts'
import {
  applyBillingSubscription,
  fetchSubscriptionByUserId,
  readStripePriceId,
  type BillingPeriod,
} from '../_billing/subscription.ts'

type FunctionRequest = {
  method: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}

type FunctionResponse = {
  status: (code: number) => FunctionResponse
  json: (body: unknown) => void
}

export default async function stripeCheckout(
  req: FunctionRequest,
  res: FunctionResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const accessToken = readBearerToken(req.headers)
  if (!accessToken) {
    res.status(401).json({ error: 'Unauthorized.' })
    return
  }

  const userId = await readUserIdFromAccessToken(accessToken)
  if (!userId) {
    res.status(401).json({ error: 'Invalid session.' })
    return
  }

  const body = readJsonBody<{
    billingPeriod?: BillingPeriod
    successUrl?: string
    cancelUrl?: string
  }>(req.body)

  if (
    !body?.billingPeriod ||
    (body.billingPeriod !== 'monthly' && body.billingPeriod !== 'annual') ||
    !body.successUrl ||
    !body.cancelUrl
  ) {
    res.status(400).json({ error: 'Invalid checkout payload.' })
    return
  }

  try {
    const existing = await fetchSubscriptionByUserId(userId)
    const customerId =
      existing?.provider === 'stripe' && existing.provider_ref?.startsWith('cus_')
        ? existing.provider_ref
        : null

    const session = await createCheckoutSession({
      userId,
      customerId,
      priceId: readStripePriceId(body.billingPeriod),
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
    })

    res.status(200).json({ checkoutUrl: session.url })
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Checkout failed.',
    })
  }
}

export async function syncStripeSubscription(
  stripeSubscriptionId: string,
  fallbackUserId?: string | null,
): Promise<void> {
  const stripeSubscription = await retrieveSubscription(stripeSubscriptionId)
  const userId = stripeSubscription.metadata?.userId ?? fallbackUserId
  if (!userId) {
    throw new Error('Missing user id on Stripe subscription.')
  }

  const interval = stripeSubscription.items?.data?.[0]?.price?.recurring?.interval
  const billingPeriod = billingPeriodFromStripeInterval(interval)
  const status = mapStripeSubscriptionStatus(stripeSubscription.status)
  const tier = status === 'canceled' ? 'free' : 'premium'

  await applyBillingSubscription({
    userId,
    tier,
    status,
    billingPeriod,
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    provider: 'stripe',
    providerRef: stripeSubscription.id,
  })
}

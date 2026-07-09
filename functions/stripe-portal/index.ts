import {
  readBearerToken,
  readJsonBody,
  readUserIdFromAccessToken,
} from '../_billing/auth.ts'
import { createBillingPortalSession, resolveStripeCustomerId } from '../_billing/stripe.ts'
import { fetchSubscriptionByUserId } from '../_billing/subscription.ts'

type FunctionRequest = {
  method: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}

type FunctionResponse = {
  status: (code: number) => FunctionResponse
  json: (body: unknown) => void
}

export default async function stripePortal(
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

  const body = readJsonBody<{ returnUrl?: string }>(req.body)
  if (!body?.returnUrl) {
    res.status(400).json({ error: 'Missing returnUrl.' })
    return
  }

  try {
    const subscription = await fetchSubscriptionByUserId(userId)
    const customerId =
      subscription?.provider === 'stripe'
        ? await resolveStripeCustomerId(subscription.provider_ref)
        : null

    if (!customerId) {
      res.status(400).json({ error: 'Aucun client Stripe associé à ce compte.' })
      return
    }

    const portal = await createBillingPortalSession({
      customerId,
      returnUrl: body.returnUrl,
    })

    res.status(200).json({ portalUrl: portal.url })
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Portal failed.',
    })
  }
}

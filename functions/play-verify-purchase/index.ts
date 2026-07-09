import {
  readBearerToken,
  readJsonBody,
  readUserIdFromAccessToken,
} from '../_billing/auth.ts'
import {
  acknowledgePlaySubscription,
  verifyPlaySubscription,
} from '../_billing/google-play.ts'
import {
  applyBillingSubscription,
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

export default async function playVerifyPurchase(
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
    productId?: string
    purchaseToken?: string
    billingPeriod?: BillingPeriod
  }>(req.body)

  if (!body?.productId || !body.purchaseToken || !body.billingPeriod) {
    res.status(400).json({ error: 'Invalid purchase payload.' })
    return
  }

  try {
    const verification = await verifyPlaySubscription({
      productId: body.productId,
      purchaseToken: body.purchaseToken,
    })

    const expiryMs = verification.expiryTimeMillis
      ? Number.parseInt(verification.expiryTimeMillis, 10)
      : Number.NaN

    if (!Number.isFinite(expiryMs) || expiryMs <= Date.now()) {
      res.status(400).json({ error: 'Abonnement Google Play expiré.' })
      return
    }

    if (verification.acknowledgementState === 0) {
      await acknowledgePlaySubscription({
        productId: body.productId,
        purchaseToken: body.purchaseToken,
      })
    }

    const status =
      verification.paymentState === 0
        ? 'trialing'
        : verification.paymentState === 1
          ? 'active'
          : 'past_due'

    await applyBillingSubscription({
      userId,
      tier: 'premium',
      status,
      billingPeriod: body.billingPeriod,
      currentPeriodEnd: new Date(expiryMs).toISOString(),
      provider: 'play',
      providerRef: body.purchaseToken,
    })

    res.status(200).json({ ok: true })
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Purchase verification failed.',
    })
  }
}

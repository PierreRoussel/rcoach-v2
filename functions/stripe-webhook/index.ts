import { createHmac, timingSafeEqual } from 'node:crypto'

import { readStripeWebhookSecret } from '../_billing/subscription.ts'
import { syncStripeSubscription } from '../stripe-checkout/index.ts'

type FunctionRequest = {
  method: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
  rawBody?: string
}

type FunctionResponse = {
  status: (code: number) => FunctionResponse
  json: (body: unknown) => void
}

function readStripeSignature(headers: FunctionRequest['headers']): string | null {
  const raw = headers['stripe-signature'] ?? headers['Stripe-Signature']
  const value = Array.isArray(raw) ? raw[0] : raw
  return value ?? null
}

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string): boolean {
  const parts = signatureHeader.split(',').map((part) => part.trim())
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2)
  const signatures = parts
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3))

  if (!timestamp || signatures.length === 0) {
    return false
  }

  const signedPayload = `${timestamp}.${payload}`
  const expected = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex')

  return signatures.some((signature) => {
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    } catch {
      return false
    }
  })
}

function readRawBody(req: FunctionRequest): string {
  if (typeof req.rawBody === 'string') {
    return req.rawBody
  }

  if (typeof req.body === 'string') {
    return req.body
  }

  return JSON.stringify(req.body ?? {})
}

export default async function stripeWebhook(
  req: FunctionRequest,
  res: FunctionResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const secret = readStripeWebhookSecret()
  if (!secret) {
    res.status(500).json({ error: 'Webhook not configured.' })
    return
  }

  const signature = readStripeSignature(req.headers)
  const rawBody = readRawBody(req)

  if (!signature || !verifyStripeSignature(rawBody, signature, secret)) {
    res.status(400).json({ error: 'Invalid signature.' })
    return
  }

  const event = JSON.parse(rawBody) as {
    type: string
    data: { object: Record<string, unknown> }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : null
        const userId =
          typeof session.client_reference_id === 'string'
            ? session.client_reference_id
            : typeof session.metadata === 'object' &&
                session.metadata &&
                typeof (session.metadata as Record<string, unknown>).userId === 'string'
              ? ((session.metadata as Record<string, string>).userId ?? null)
              : null

        if (subscriptionId) {
          await syncStripeSubscription(subscriptionId, userId)
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const subscriptionId = typeof subscription.id === 'string' ? subscription.id : null
        if (subscriptionId) {
          await syncStripeSubscription(subscriptionId)
        }
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const subscriptionId =
          typeof invoice.subscription === 'string' ? invoice.subscription : null
        if (subscriptionId) {
          await syncStripeSubscription(subscriptionId)
        }
        break
      }
      default:
        break
    }

    res.status(200).json({ received: true })
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Webhook handling failed.',
    })
  }
}

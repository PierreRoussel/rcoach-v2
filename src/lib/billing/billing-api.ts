import type { BillingPeriod } from '@/lib/billing/product-ids'
import { postNhostFunction } from '@/lib/nhost/function-request'

export async function createStripeCheckoutSession(
  accessToken: string,
  billingPeriod: BillingPeriod,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const payload = await postNhostFunction<{ checkoutUrl: string }>(
    accessToken,
    'stripe-checkout',
    {
      billingPeriod,
      successUrl,
      cancelUrl,
    },
  )

  if (!payload.checkoutUrl) {
    throw new Error('Session de paiement indisponible.')
  }

  return payload.checkoutUrl
}

export async function createStripePortalSession(
  accessToken: string,
  returnUrl: string,
): Promise<string> {
  const payload = await postNhostFunction<{ portalUrl: string }>(
    accessToken,
    'stripe-portal',
    { returnUrl },
  )

  if (!payload.portalUrl) {
    throw new Error('Portail de facturation indisponible.')
  }

  return payload.portalUrl
}

export async function verifyPlayPurchase(
  accessToken: string,
  input: {
    productId: string
    purchaseToken: string
    billingPeriod: BillingPeriod
  },
): Promise<void> {
  await postNhostFunction<{ ok: true }>(accessToken, 'play-verify-purchase', input)
}

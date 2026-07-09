import { generateServiceUrl } from '@nhost/nhost-js'

import type { BillingPeriod } from '@/lib/billing/product-ids'

function readFunctionsBaseUrl(): string | null {
  const configured = import.meta.env.VITE_BILLING_FUNCTION_BASE?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }

  const subdomain = import.meta.env.VITE_NHOST_SUBDOMAIN?.trim()
  const region = import.meta.env.VITE_NHOST_REGION?.trim()
  if (!subdomain || !region) {
    return null
  }

  return generateServiceUrl('functions', subdomain, region)
}

async function billingFunctionRequest<T>(
  accessToken: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const baseUrl = readFunctionsBaseUrl()
  if (!baseUrl) {
    throw new Error('Configuration de facturation indisponible.')
  }

  const response = await fetch(`${baseUrl}/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; checkoutUrl?: string; portalUrl?: string }
    | T
    | null

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error
        ? payload.error
        : `Erreur facturation (${response.status}).`
    throw new Error(message)
  }

  return payload as T
}

export async function createStripeCheckoutSession(
  accessToken: string,
  billingPeriod: BillingPeriod,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const payload = await billingFunctionRequest<{ checkoutUrl: string }>(
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
  const payload = await billingFunctionRequest<{ portalUrl: string }>(
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
  await billingFunctionRequest<{ ok: true }>(accessToken, 'play-verify-purchase', input)
}

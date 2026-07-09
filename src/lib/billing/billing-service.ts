import type { NhostClient } from '@nhost/nhost-js'

import { createStripeCheckoutSession, createStripePortalSession } from '@/lib/billing/billing-api'
import { resolveBillingChannel } from '@/lib/billing/billing-channel'
import {
  openPlaySubscriptionManagement,
  purchasePlaySubscription,
  restorePlayPurchases,
} from '@/lib/billing/play-billing'
import type { BillingPeriod } from '@/lib/billing/product-ids'

function readAccessToken(nhost: NhostClient): string {
  const token = nhost.getUserSession()?.accessToken
  if (!token) {
    throw new Error('Session expirée. Reconnectez-vous.')
  }

  return token
}

function buildCheckoutUrls(billingPeriod: BillingPeriod) {
  const origin = window.location.origin
  return {
    successUrl: `${origin}/app/profile/subscription?checkout=success&billingPeriod=${billingPeriod}`,
    cancelUrl: `${origin}/app/premium?checkout=canceled`,
  }
}

export async function purchasePremium(
  nhost: NhostClient,
  billingPeriod: BillingPeriod,
): Promise<void> {
  const channel = resolveBillingChannel()
  const accessToken = readAccessToken(nhost)

  if (channel === 'play') {
    await purchasePlaySubscription(accessToken, billingPeriod)
    return
  }

  if (channel === 'stripe') {
    const { successUrl, cancelUrl } = buildCheckoutUrls(billingPeriod)
    const checkoutUrl = await createStripeCheckoutSession(
      accessToken,
      billingPeriod,
      successUrl,
      cancelUrl,
    )
    window.location.assign(checkoutUrl)
    return
  }

  throw new Error('Achat indisponible sur cette plateforme.')
}

export async function restorePremiumPurchases(nhost: NhostClient): Promise<void> {
  const channel = resolveBillingChannel()
  const accessToken = readAccessToken(nhost)

  if (channel === 'play') {
    await restorePlayPurchases(accessToken)
    return
  }

  if (channel === 'stripe') {
    const portalUrl = await createStripePortalSession(
      accessToken,
      `${window.location.origin}/app/profile/subscription`,
    )
    window.location.assign(portalUrl)
    return
  }

  throw new Error('Restauration indisponible sur cette plateforme.')
}

export async function openSubscriptionManagement(
  nhost: NhostClient,
  provider: 'play' | 'stripe' | 'none',
): Promise<void> {
  if (provider === 'play') {
    openPlaySubscriptionManagement()
    return
  }

  if (provider === 'stripe') {
    const accessToken = readAccessToken(nhost)
    const portalUrl = await createStripePortalSession(
      accessToken,
      `${window.location.origin}/app/profile/subscription`,
    )
    window.location.assign(portalUrl)
    return
  }

  throw new Error('Aucun abonnement géré à modifier.')
}

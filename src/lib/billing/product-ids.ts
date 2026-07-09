export type BillingPeriod = 'monthly' | 'annual'

export type PlayProductIds = {
  monthly: string
  annual: string
}

export function readPlayProductIds(): PlayProductIds {
  return {
    monthly:
      import.meta.env.VITE_PLAY_PRODUCT_MONTHLY?.trim() || 'rcoach_premium_monthly',
    annual:
      import.meta.env.VITE_PLAY_PRODUCT_ANNUAL?.trim() || 'rcoach_premium_annual',
  }
}

export function billingPeriodFromPlayProductId(
  productId: string,
  ids: PlayProductIds = readPlayProductIds(),
): BillingPeriod | null {
  if (productId === ids.monthly) {
    return 'monthly'
  }

  if (productId === ids.annual) {
    return 'annual'
  }

  return null
}

export function playProductIdForBillingPeriod(
  billingPeriod: BillingPeriod,
  ids: PlayProductIds = readPlayProductIds(),
): string {
  return billingPeriod === 'annual' ? ids.annual : ids.monthly
}

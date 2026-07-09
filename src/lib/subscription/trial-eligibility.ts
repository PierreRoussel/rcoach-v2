export function hasConsumedPremiumTrial(
  trialConsumedAt: string | null | undefined,
): boolean {
  return trialConsumedAt != null
}

export function canStartPremiumTrial(input: {
  isPremium: boolean
  trialConsumedAt: string | null | undefined
}): boolean {
  return !input.isPremium && !hasConsumedPremiumTrial(input.trialConsumedAt)
}

export function canSubscribeToPremiumOffer(input: {
  isPremium: boolean
}): boolean {
  return !input.isPremium
}

export function isManagedByBillingProviderError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return message.includes('managed_by_billing_provider')
}

export function isTrialAlreadyConsumedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return (
    message.includes('trial_already_consumed') ||
    message.includes('trial already consumed')
  )
}

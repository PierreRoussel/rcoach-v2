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

export function isTrialAlreadyConsumedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('trial_already_consumed')
}

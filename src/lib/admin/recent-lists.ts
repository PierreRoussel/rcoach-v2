export type AdminRecentUser = {
  id: string
  displayName: string
  role: string
  createdAt: string
  onboardingCompletedAt: string | null
  isPremium: boolean
}

export type AdminRecentSubscription = {
  id: string
  userId: string
  displayName: string
  tier: string
  status: string
  billingPeriod: string | null
  createdAt: string
  updatedAt: string
  currentPeriodEnd: string | null
  trialConsumedAt: string | null
}

export type AdminRecentLists = {
  recentUsers: AdminRecentUser[]
  recentSubscriptions: AdminRecentSubscription[]
  limit: number
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function asBoolean(value: unknown): boolean {
  return value === true
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function parseAdminRecentLists(value: unknown): AdminRecentLists {
  const payload = (value ?? {}) as Partial<AdminRecentLists>

  return {
    recentUsers: Array.isArray(payload.recentUsers)
      ? payload.recentUsers.map((row) => ({
          id: asString((row as AdminRecentUser)?.id),
          displayName: asString((row as AdminRecentUser)?.displayName, 'Sans nom'),
          role: asString((row as AdminRecentUser)?.role, 'athlete'),
          createdAt: asString((row as AdminRecentUser)?.createdAt),
          onboardingCompletedAt: asNullableString(
            (row as AdminRecentUser)?.onboardingCompletedAt,
          ),
          isPremium: asBoolean((row as AdminRecentUser)?.isPremium),
        }))
      : [],
    recentSubscriptions: Array.isArray(payload.recentSubscriptions)
      ? payload.recentSubscriptions.map((row) => ({
          id: asString((row as AdminRecentSubscription)?.id),
          userId: asString((row as AdminRecentSubscription)?.userId),
          displayName: asString((row as AdminRecentSubscription)?.displayName, 'Sans nom'),
          tier: asString((row as AdminRecentSubscription)?.tier),
          status: asString((row as AdminRecentSubscription)?.status),
          billingPeriod: asNullableString((row as AdminRecentSubscription)?.billingPeriod),
          createdAt: asString((row as AdminRecentSubscription)?.createdAt),
          updatedAt: asString((row as AdminRecentSubscription)?.updatedAt),
          currentPeriodEnd: asNullableString(
            (row as AdminRecentSubscription)?.currentPeriodEnd,
          ),
          trialConsumedAt: asNullableString(
            (row as AdminRecentSubscription)?.trialConsumedAt,
          ),
        }))
      : [],
    limit: asNumber(payload.limit, 25),
  }
}

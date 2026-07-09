export type AdminDailyCount = {
  date: string
  count: number
  cumulative?: number
}

export type AdminDailyDau = {
  date: string
  dau: number
}

export type AdminSubscriptionBreakdownRow = {
  tier: string
  status: string
  billingPeriod: string | null
  count: number
}

export type AdminFunnel = {
  registered: number
  onboardingCompleted: number
  firstWorkout: number
  firstMeal: number
  trialStarted: number
}

export type AdminRetentionCohort = {
  cohortWeek: string
  signupCount: number
  retentionJ7Pct: number | null
  retentionJ30Pct: number | null
}

export type AdminPlatformMetrics = {
  summary: {
    totalUsers: number
    newUsersInRange: number
    onboardingCompleted: number
    premiumActive: number
    freeActive: number
    trialingActive: number
    canceledSubscriptions: number
    latestDau: number
  }
  signupsDaily: AdminDailyCount[]
  activeUsersDaily: AdminDailyDau[]
  subscriptionsBreakdown: AdminSubscriptionBreakdownRow[]
  featureUsageDaily: {
    workoutsDaily: AdminDailyCount[]
    mealsDaily: AdminDailyCount[]
    weightGoalsDaily: AdminDailyCount[]
    friendshipsDaily: AdminDailyCount[]
    coachClientsDaily: AdminDailyCount[]
    activeCoaches: number
  }
  funnel: AdminFunnel
  retentionCohorts: AdminRetentionCohort[]
  revenue: {
    monthlySubscribers: number
    annualSubscribers: number
    mrrCents: number
    arrCents: number
    isEstimate: boolean
  }
  churnReasons: Array<{ reason: string; count: number }>
  ops: {
    profiles: number
    subscriptions: number
    workouts: number
    mealLogEntries: number
    latestProfileAt: string | null
    latestWorkoutAt: string | null
    latestMealLogAt: string | null
  }
  range: {
    from: string
    to: string
    cohortWeeks: number
  }
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function parseDailyCounts(value: unknown): AdminDailyCount[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((entry) => ({
    date: asString((entry as AdminDailyCount)?.date),
    count: asNumber((entry as AdminDailyCount)?.count),
    cumulative:
      (entry as AdminDailyCount)?.cumulative == null
        ? undefined
        : asNumber((entry as AdminDailyCount)?.cumulative),
  }))
}

function parseDailyDau(value: unknown): AdminDailyDau[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((entry) => ({
    date: asString((entry as AdminDailyDau)?.date),
    dau: asNumber((entry as AdminDailyDau)?.dau),
  }))
}

export function parseAdminPlatformMetrics(value: unknown): AdminPlatformMetrics {
  const payload = (value ?? {}) as Partial<AdminPlatformMetrics>
  const summary = (payload.summary ?? {}) as AdminPlatformMetrics['summary']
  const featureUsage = (payload.featureUsageDaily ??
    {}) as AdminPlatformMetrics['featureUsageDaily']
  const funnel = (payload.funnel ?? {}) as AdminFunnel
  const revenue = (payload.revenue ?? {}) as AdminPlatformMetrics['revenue']
  const ops = (payload.ops ?? {}) as AdminPlatformMetrics['ops']
  const range = (payload.range ?? {}) as AdminPlatformMetrics['range']

  return {
    summary: {
      totalUsers: asNumber(summary.totalUsers),
      newUsersInRange: asNumber(summary.newUsersInRange),
      onboardingCompleted: asNumber(summary.onboardingCompleted),
      premiumActive: asNumber(summary.premiumActive),
      freeActive: asNumber(summary.freeActive),
      trialingActive: asNumber(summary.trialingActive),
      canceledSubscriptions: asNumber(summary.canceledSubscriptions),
      latestDau: asNumber(summary.latestDau),
    },
    signupsDaily: parseDailyCounts(payload.signupsDaily),
    activeUsersDaily: parseDailyDau(payload.activeUsersDaily),
    subscriptionsBreakdown: Array.isArray(payload.subscriptionsBreakdown)
      ? payload.subscriptionsBreakdown.map((row) => ({
          tier: asString((row as AdminSubscriptionBreakdownRow)?.tier),
          status: asString((row as AdminSubscriptionBreakdownRow)?.status),
          billingPeriod: asNullableString(
            (row as AdminSubscriptionBreakdownRow)?.billingPeriod,
          ),
          count: asNumber((row as AdminSubscriptionBreakdownRow)?.count),
        }))
      : [],
    featureUsageDaily: {
      workoutsDaily: parseDailyCounts(featureUsage.workoutsDaily),
      mealsDaily: parseDailyCounts(featureUsage.mealsDaily),
      weightGoalsDaily: parseDailyCounts(featureUsage.weightGoalsDaily),
      friendshipsDaily: parseDailyCounts(featureUsage.friendshipsDaily),
      coachClientsDaily: parseDailyCounts(featureUsage.coachClientsDaily),
      activeCoaches: asNumber(featureUsage.activeCoaches),
    },
    funnel: {
      registered: asNumber(funnel.registered),
      onboardingCompleted: asNumber(funnel.onboardingCompleted),
      firstWorkout: asNumber(funnel.firstWorkout),
      firstMeal: asNumber(funnel.firstMeal),
      trialStarted: asNumber(funnel.trialStarted),
    },
    retentionCohorts: Array.isArray(payload.retentionCohorts)
      ? payload.retentionCohorts.map((row) => ({
          cohortWeek: asString((row as AdminRetentionCohort)?.cohortWeek),
          signupCount: asNumber((row as AdminRetentionCohort)?.signupCount),
          retentionJ7Pct:
            (row as AdminRetentionCohort)?.retentionJ7Pct == null
              ? null
              : asNumber((row as AdminRetentionCohort)?.retentionJ7Pct),
          retentionJ30Pct:
            (row as AdminRetentionCohort)?.retentionJ30Pct == null
              ? null
              : asNumber((row as AdminRetentionCohort)?.retentionJ30Pct),
        }))
      : [],
    revenue: {
      monthlySubscribers: asNumber(revenue.monthlySubscribers),
      annualSubscribers: asNumber(revenue.annualSubscribers),
      mrrCents: asNumber(revenue.mrrCents),
      arrCents: asNumber(revenue.arrCents),
      isEstimate: revenue.isEstimate !== false,
    },
    churnReasons: Array.isArray(payload.churnReasons)
      ? payload.churnReasons.map((row) => ({
          reason: asString((row as { reason?: string })?.reason, 'non_renseigne'),
          count: asNumber((row as { count?: number })?.count),
        }))
      : [],
    ops: {
      profiles: asNumber(ops.profiles),
      subscriptions: asNumber(ops.subscriptions),
      workouts: asNumber(ops.workouts),
      mealLogEntries: asNumber(ops.mealLogEntries),
      latestProfileAt: asNullableString(ops.latestProfileAt),
      latestWorkoutAt: asNullableString(ops.latestWorkoutAt),
      latestMealLogAt: asNullableString(ops.latestMealLogAt),
    },
    range: {
      from: asString(range.from),
      to: asString(range.to),
      cohortWeeks: asNumber(range.cohortWeeks, 12),
    },
  }
}

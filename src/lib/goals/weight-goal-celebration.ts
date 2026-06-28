import {
  differenceInCalendarDays,
  eachWeekOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { fr } from 'date-fns/locale'

import type { WeightEntry } from '@/lib/graphql/operations'

import {
  isWeightGoalReached,
  progressKgSinceStart,
  type WeightGoal,
} from './weight-goal'

const STORAGE_PREFIX = 'weight-goal-reached-celebration'
const WEEK_OPTS = { weekStartsOn: 1 as const }

export function weightGoalReachedCelebrationKey(
  userId: string,
  goal: Pick<WeightGoal, 'created_at' | 'target_weight_kg'>,
) {
  return `${STORAGE_PREFIX}:${userId}:${goal.created_at}:${goal.target_weight_kg}`
}

export function hasSeenWeightGoalReachedCelebration(
  userId: string,
  goal: WeightGoal,
) {
  if (typeof localStorage === 'undefined') {
    return false
  }

  return (
    localStorage.getItem(weightGoalReachedCelebrationKey(userId, goal)) === '1'
  )
}

export function markWeightGoalReachedCelebrationSeen(
  userId: string,
  goal: WeightGoal,
) {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(weightGoalReachedCelebrationKey(userId, goal), '1')
}

export function shouldShowWeightGoalReachedCelebration(
  goal: WeightGoal,
  userId: string,
) {
  if (goal.goal_type === 'maintain') {
    return false
  }

  if (!isWeightGoalReached(goal)) {
    return false
  }

  return !hasSeenWeightGoalReachedCelebration(userId, goal)
}

export function computeAverageWeeklyChangeGrams(
  goal: Pick<
    WeightGoal,
    'goal_type' | 'start_weight_kg' | 'current_weight_kg' | 'created_at'
  >,
  now: Date = new Date(),
): number | null {
  if (goal.goal_type === 'maintain') {
    return null
  }

  const progressKg = progressKgSinceStart(goal)
  if (progressKg <= 0) {
    return null
  }

  const days = Math.max(
    1,
    differenceInCalendarDays(startOfDay(now), startOfDay(parseISO(goal.created_at))),
  )
  const weeklyKg = progressKg / (days / 7)
  return Math.round(weeklyKg * 1000)
}

export function computeJourneyDurationDays(
  goal: Pick<WeightGoal, 'created_at'>,
  now: Date = new Date(),
) {
  return Math.max(
    1,
    differenceInCalendarDays(startOfDay(now), startOfDay(parseISO(goal.created_at))),
  )
}

export function formatJourneyDuration(
  goal: Pick<WeightGoal, 'created_at'>,
  now: Date = new Date(),
) {
  const days = computeJourneyDurationDays(goal, now)

  if (days < 14) {
    return `${days} jour${days > 1 ? 's' : ''}`
  }

  const weeks = Math.round(days / 7)
  if (weeks < 12) {
    return `${weeks} semaine${weeks > 1 ? 's' : ''}`
  }

  const months = Math.max(1, Math.round(days / 30))
  return `${months} mois`
}

export type JourneyChartPoint = {
  weekKey: string
  weekLabel: string
  weight: number | null
}

export function buildJourneyChartData(
  goal: WeightGoal,
  entries: WeightEntry[],
  now: Date = new Date(),
): JourneyChartPoint[] {
  const goalStart = startOfDay(parseISO(goal.created_at))
  const today = startOfDay(now)
  const rangeStart = startOfWeek(goalStart, WEEK_OPTS)
  const rangeEnd = startOfWeek(today, WEEK_OPTS)

  if (rangeEnd < rangeStart) {
    return []
  }

  const relevantEntries = entries.filter(
    (entry) => startOfDay(parseISO(entry.logged_at)) >= goalStart,
  )

  const buckets = new Map<string, number[]>()
  const startWeekKey = format(rangeStart, 'yyyy-MM-dd')
  buckets.set(startWeekKey, [goal.start_weight_kg])

  for (const entry of relevantEntries) {
    const weekKey = format(
      startOfWeek(parseISO(entry.logged_at), WEEK_OPTS),
      'yyyy-MM-dd',
    )
    const weights = buckets.get(weekKey) ?? []
    weights.push(Number(entry.weight_kg))
    buckets.set(weekKey, weights)
  }

  const currentWeekKey = format(rangeEnd, 'yyyy-MM-dd')
  const currentWeekWeights = buckets.get(currentWeekKey) ?? []
  currentWeekWeights.push(goal.current_weight_kg)
  buckets.set(currentWeekKey, currentWeekWeights)

  const weeks = eachWeekOfInterval(
    { start: rangeStart, end: rangeEnd },
    WEEK_OPTS,
  )

  return weeks.map((weekStart) => {
    const weekKey = format(weekStart, 'yyyy-MM-dd')
    const weights = buckets.get(weekKey)
    const weight = weights
      ? Math.round(
          (weights.reduce((sum, value) => sum + value, 0) / weights.length) * 10,
        ) / 10
      : null

    return {
      weekKey,
      weekLabel: format(weekStart, 'd MMM', { locale: fr }),
      weight,
    }
  })
}

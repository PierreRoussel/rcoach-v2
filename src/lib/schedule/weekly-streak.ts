import { getISOWeek, getISOWeekYear, parseISO, startOfDay, subWeeks } from 'date-fns'

import type { WorkoutSummary } from '@/lib/graphql/operations'

type WorkoutStreakSource = Pick<WorkoutSummary, 'started_at'> | { started_at: string }

function weekKey(date: Date): string {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`
}

export function getWeeksWithWorkouts(workouts: WorkoutStreakSource[]): Set<string> {
  const weeks = new Set<string>()

  for (const workout of workouts) {
    weeks.add(weekKey(parseISO(workout.started_at)))
  }

  return weeks
}

export function computeWeeklyStreak(workouts: WorkoutStreakSource[], now = new Date()): number {
  const weeksWithWorkouts = getWeeksWithWorkouts(workouts)
  let streak = 0
  let cursor = startOfDay(now)

  while (weeksWithWorkouts.has(weekKey(cursor))) {
    streak += 1
    cursor = subWeeks(cursor, 1)
  }

  return streak
}

export function formatWeeklyStreakLabel(streak: number): string {
  if (streak === 0) {
    return 'Aucune semaine active en cours'
  }

  if (streak === 1) {
    return "1 semaine d'affilée"
  }

  return `${streak} semaines d'affilée`
}

export function formatWeekLabel(date: Date): string {
  return `Semaine ${getISOWeek(date)}`
}

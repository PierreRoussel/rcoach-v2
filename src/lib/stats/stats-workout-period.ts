import { subMonths } from 'date-fns'

import type { StatsPeriod } from '@/lib/stats/exercise-progression'

/** Période de fetch pour les stats agrégées (dashboard). */
export type StatsWorkoutPeriod = '3m' | '6m' | 'all'

/** Période interne incluant 12 mois pour les graphiques exercice « Cette année ». */
export type StatsWorkoutFetchPeriod = StatsWorkoutPeriod | '12m'

export const STATS_WORKOUT_PERIOD_OPTIONS: Array<{
  value: StatsWorkoutPeriod
  label: string
}> = [
  { value: '3m', label: '3 mois' },
  { value: '6m', label: '6 mois' },
  { value: 'all', label: 'Toujours' },
]

export function resolveStatsWorkoutRange(
  period: StatsWorkoutFetchPeriod,
  now = new Date(),
): { since: Date | null; until: Date } {
  const until = now

  switch (period) {
    case '3m':
      return { since: subMonths(until, 3), until }
    case '6m':
      return { since: subMonths(until, 6), until }
    case '12m':
      return { since: subMonths(until, 12), until }
    case 'all':
    default:
      return { since: null, until }
  }
}

export function exercisePeriodToStatsWorkoutFetchPeriod(
  period: StatsPeriod,
): StatsWorkoutFetchPeriod {
  switch (period) {
    case '3m':
      return '3m'
    case 'month':
      return '3m'
    case 'year':
      return '12m'
    case 'all':
    default:
      return 'all'
  }
}

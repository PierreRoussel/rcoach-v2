import { addDays, toDateKey } from '@/lib/nutrition/dates'

export type NutritionDayLogStatus = 'none' | 'on_target' | 'over_target'

export type NutritionDayAggregate = {
  calories: number
  hasLogs: boolean
  status: NutritionDayLogStatus
}

export function aggregateNutritionDays(
  entries: Array<{ logged_date: string; calories: number }>,
  dailyTarget: number,
): Map<string, NutritionDayAggregate> {
  const map = new Map<string, NutritionDayAggregate>()

  for (const entry of entries) {
    const current = map.get(entry.logged_date) ?? {
      calories: 0,
      hasLogs: false,
      status: 'none' as NutritionDayLogStatus,
    }

    current.calories += Number(entry.calories)
    current.hasLogs = true
    map.set(entry.logged_date, current)
  }

  for (const aggregate of map.values()) {
    aggregate.status =
      aggregate.calories <= dailyTarget ? 'on_target' : 'over_target'
  }

  return map
}

export function computeNutritionLoggingStreak(
  loggedDates: Iterable<string>,
  today = toDateKey(new Date()),
): number {
  const dates = new Set(loggedDates)
  let cursor = dates.has(today) ? today : addDays(today, -1)

  let streak = 0
  while (dates.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}

export function monthDateRange(year: number, monthIndex: number) {
  const from = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const to = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { from, to, daysInMonth: lastDay }
}

export function computeMonthOnTargetSummary(
  dayMap: Map<string, NutritionDayAggregate>,
  year: number,
  monthIndex: number,
): { onTargetDays: number; daysInMonth: number } {
  const { daysInMonth } = monthDateRange(year, monthIndex)
  let onTargetDays = 0

  for (let day = 1; day <= daysInMonth; day += 1) {
    const month = String(monthIndex + 1).padStart(2, '0')
    const dateKey = `${year}-${month}-${String(day).padStart(2, '0')}`

    if (dayMap.get(dateKey)?.status === 'on_target') {
      onTargetDays += 1
    }
  }

  return { onTargetDays, daysInMonth }
}

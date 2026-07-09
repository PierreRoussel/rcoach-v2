import { addDays, toDateKey } from '@/lib/nutrition/dates'
import { MEAL_TYPES, type MealType } from '@/lib/nutrition/types'

export type NutritionDayLogStatus = 'none' | 'on_target' | 'over_target'

export type NutritionDayAggregate = {
  calories: number
  hasLogs: boolean
  status: NutritionDayLogStatus
  loggedMeals?: MealType[]
}

export function aggregateNutritionDays(
  entries: Array<{ logged_date: string; calories: number; meal_type?: MealType }>,
  dailyTarget: number,
): Map<string, NutritionDayAggregate> {
  const map = new Map<string, NutritionDayAggregate>()
  const mealSets = new Map<string, Set<MealType>>()

  for (const entry of entries) {
    const current = map.get(entry.logged_date) ?? {
      calories: 0,
      hasLogs: false,
      status: 'none' as NutritionDayLogStatus,
      loggedMeals: [] as MealType[],
    }

    current.calories += Number(entry.calories)
    current.hasLogs = true
    map.set(entry.logged_date, current)

    if (entry.meal_type) {
      const meals = mealSets.get(entry.logged_date) ?? new Set<MealType>()
      meals.add(entry.meal_type)
      mealSets.set(entry.logged_date, meals)
    }
  }

  for (const [dateKey, aggregate] of map.entries()) {
    aggregate.status =
      aggregate.calories <= dailyTarget ? 'on_target' : 'over_target'
    const meals = mealSets.get(dateKey)
    aggregate.loggedMeals = meals
      ? MEAL_TYPES.filter((mealType) => meals.has(mealType))
      : []
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

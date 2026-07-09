import { differenceInCalendarDays, parseISO, subDays } from 'date-fns'

import type { WeightEntry } from '@/lib/graphql/operations'
import {
  isWeightGoalReached,
  suggestCalorieTarget,
  type WeightGoal,
} from '@/lib/goals/weight-goal'
import type { StoredUserMeasurements } from '@/lib/measurements/types'
import { addDays, toDateKey } from '@/lib/nutrition/dates'
import type { NutritionDayAggregate } from '@/lib/nutrition/streak'
import type { NutritionSettings } from '@/lib/nutrition/types'

import {
  isGoalCoachingSnoozeActive,
  type GoalCoachingStorageState,
} from './goal-coaching-storage'

export const GOAL_COACHING_STAGNATION_DAYS = 14
export const GOAL_COACHING_STAGNATION_THRESHOLD_KG = 0.2
export const GOAL_COACHING_DIET_ADHERENCE_DAYS = 10
export const GOAL_COACHING_DIET_WINDOW_DAYS = 14
export const GOAL_COACHING_MIN_AGE_DAYS = 14
const MIN_CALORIE_FLOOR = 1200
const KCAL_REFINEMENT_DELTA = 125

export function findReferenceWeightKg(
  entries: WeightEntry[],
  now = new Date(),
): { weightKg: number; loggedAt: string } | null {
  const cutoff = subDays(now, GOAL_COACHING_STAGNATION_DAYS)
  const cutoffTime = cutoff.getTime()

  let best: WeightEntry | null = null

  for (const entry of entries) {
    const loggedAt = parseISO(entry.logged_at)
    if (Number.isNaN(loggedAt.getTime()) || loggedAt.getTime() > cutoffTime) {
      continue
    }

    if (
      !best ||
      loggedAt.getTime() > parseISO(best.logged_at).getTime()
    ) {
      best = entry
    }
  }

  return best
    ? { weightKg: best.weight_kg, loggedAt: best.logged_at }
    : null
}

export function computeWeightProgressKg(
  goalType: 'lose' | 'gain',
  referenceKg: number,
  currentKg: number,
): number {
  if (goalType === 'lose') {
    return referenceKg - currentKg
  }

  return currentKg - referenceKg
}

export function isWeightStagnant(
  goal: Pick<WeightGoal, 'goal_type' | 'current_weight_kg' | 'target_weight_kg'>,
  entries: WeightEntry[],
  now = new Date(),
  thresholdKg = GOAL_COACHING_STAGNATION_THRESHOLD_KG,
): boolean {
  if (goal.goal_type !== 'lose' && goal.goal_type !== 'gain') {
    return false
  }

  if (isWeightGoalReached(goal)) {
    return false
  }

  const reference = findReferenceWeightKg(entries, now)
  if (!reference) {
    return false
  }

  const progress = computeWeightProgressKg(
    goal.goal_type,
    reference.weightKg,
    goal.current_weight_kg,
  )

  return progress < thresholdKg
}

export function isGoalOldEnough(
  goal: Pick<WeightGoal, 'created_at' | 'updated_at'>,
  now = new Date(),
  minAgeDays = GOAL_COACHING_MIN_AGE_DAYS,
): boolean {
  const created = parseISO(goal.created_at)
  const updated = parseISO(goal.updated_at)
  const referenceDate = new Date(
    Math.max(
      Number.isNaN(created.getTime()) ? 0 : created.getTime(),
      Number.isNaN(updated.getTime()) ? 0 : updated.getTime(),
    ),
  )

  if (Number.isNaN(referenceDate.getTime()) || referenceDate.getTime() === 0) {
    return false
  }

  return differenceInCalendarDays(now, referenceDate) >= minAgeDays
}

export type ShouldOfferGoalCoachingInput = {
  isPremium: boolean
  goal: WeightGoal | null | undefined
  entries: WeightEntry[]
  remindersEnabled: boolean
  storage: GoalCoachingStorageState
  now?: Date
}

export function shouldOfferGoalCoaching(
  input: ShouldOfferGoalCoachingInput,
): boolean {
  const {
    isPremium,
    goal,
    entries,
    remindersEnabled,
    storage,
    now = new Date(),
  } = input

  if (!isPremium || !goal || !remindersEnabled) {
    return false
  }

  if (goal.goal_type !== 'lose' && goal.goal_type !== 'gain') {
    return false
  }

  if (isWeightGoalReached(goal)) {
    return false
  }

  if (!isGoalOldEnough(goal, now)) {
    return false
  }

  if (isGoalCoachingSnoozeActive(storage, now)) {
    return false
  }

  return isWeightStagnant(goal, entries, now)
}

export type DietAdherence14d = {
  loggedDays: number
  windowDays: number
  adherent: boolean
}

export function resolveDietAdherence14d(
  dayMap: Map<string, NutritionDayAggregate>,
  now = new Date(),
): DietAdherence14d {
  const today = toDateKey(now)
  let loggedDays = 0

  for (let index = 0; index < GOAL_COACHING_DIET_WINDOW_DAYS; index += 1) {
    const dateKey = addDays(today, -index)
    if (dayMap.get(dateKey)?.hasLogs) {
      loggedDays += 1
    }
  }

  return {
    loggedDays,
    windowDays: GOAL_COACHING_DIET_WINDOW_DAYS,
    adherent: loggedDays >= GOAL_COACHING_DIET_ADHERENCE_DAYS,
  }
}

export function computeObservedAvgKcal14d(
  dayMap: Map<string, NutritionDayAggregate>,
  now = new Date(),
): number | null {
  const today = toDateKey(now)
  let total = 0
  let count = 0

  for (let index = 0; index < GOAL_COACHING_DIET_WINDOW_DAYS; index += 1) {
    const dateKey = addDays(today, -index)
    const day = dayMap.get(dateKey)
    if (day?.hasLogs) {
      total += day.calories
      count += 1
    }
  }

  return count > 0 ? Math.round(total / count) : null
}

export type CalorieAdjustmentSuggestion = {
  suggestedCalories: number
  rationale: string
  delta: number
  tdee: number
  currentCalories: number
  observedAvgKcal: number | null
}

export function suggestIntelligentCalorieAdjustment(
  settings: NutritionSettings,
  measurements: StoredUserMeasurements | null | undefined,
  goal: Pick<WeightGoal, 'goal_type' | 'current_weight_kg'>,
  observedAvgKcal: number | null,
): CalorieAdjustmentSuggestion | null {
  if (goal.goal_type !== 'lose' && goal.goal_type !== 'gain') {
    return null
  }

  const base = suggestCalorieTarget(
    settings,
    goal.goal_type,
    goal.current_weight_kg,
    measurements,
  )

  if (!base) {
    return null
  }

  let suggestedCalories = base.suggestedCalories
  const rationales: string[] = [
    `Basé sur votre TDEE estimé (${Math.round(base.tdee)} kcal/j) et votre objectif de ${goal.goal_type === 'lose' ? 'perte' : 'prise'} de poids.`,
  ]

  const target = settings.daily_calorie_target

  if (observedAvgKcal != null) {
    rationales.push(
      `Votre moyenne observée sur 14 jours est de ${observedAvgKcal} kcal/j.`,
    )

    if (goal.goal_type === 'gain' && observedAvgKcal < target - 50) {
      suggestedCalories += KCAL_REFINEMENT_DELTA
      rationales.push(
        'Votre apport réel est inférieur à la cible : une légère augmentation est conseillée.',
      )
    } else if (goal.goal_type === 'lose' && observedAvgKcal > target + 50) {
      suggestedCalories -= KCAL_REFINEMENT_DELTA
      rationales.push(
        'Votre apport réel dépasse la cible : une légère réduction est conseillée.',
      )
    }
  }

  const maxCalories = Math.round(base.tdee * 1.15)
  suggestedCalories = Math.max(
    MIN_CALORIE_FLOOR,
    Math.min(maxCalories, Math.round(suggestedCalories / 10) * 10),
  )

  const sportNote =
    settings.activity_level === 'sedentary' ||
    settings.activity_level === 'light'
      ? "Envisagez d'ajouter 2–3 séances de sport par semaine pour soutenir votre objectif."
      : "Votre niveau d'activité actuel est pris en compte — maintenez une pratique sportive régulière."

  rationales.push(sportNote)

  return {
    suggestedCalories,
    rationale: rationales.join(' '),
    delta: suggestedCalories - settings.daily_calorie_target,
    tdee: base.tdee,
    currentCalories: settings.daily_calorie_target,
    observedAvgKcal,
  }
}

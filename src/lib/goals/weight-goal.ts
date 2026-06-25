import { calculateTdee } from '@/lib/nutrition/tdee'
import type { NutritionGoal, NutritionSettings } from '@/lib/nutrition/types'

export const WEIGHT_ADJUST_STEP_KG = 0.1
export const WEIGHT_MILESTONE_STEP_KG = 0.5
/** @deprecated Use WEIGHT_ADJUST_STEP_KG or WEIGHT_MILESTONE_STEP_KG */
export const WEIGHT_GOAL_STEP_KG = WEIGHT_MILESTONE_STEP_KG
export const WEIGHT_GOAL_MAINTAIN_THRESHOLD_KG = 0.25
export const CALORIE_SUGGESTION_THRESHOLD = 50
export const KCAL_PER_KG = 7700

export type WeightGoal = {
  user_id: string
  target_weight_kg: number
  start_weight_kg: number
  current_weight_kg: number
  goal_type: NutritionGoal
  last_milestone_step: number
  created_at: string
  updated_at: string
}

export const WEIGHT_GOAL_TYPE_LABELS: Record<NutritionGoal, string> = {
  lose: 'Perte de poids',
  maintain: 'Conservation',
  gain: 'Prise de masse',
}

export function inferWeightGoalType(startKg: number, targetKg: number): NutritionGoal {
  const diff = targetKg - startKg

  if (Math.abs(diff) < WEIGHT_GOAL_MAINTAIN_THRESHOLD_KG) {
    return 'maintain'
  }

  return diff < 0 ? 'lose' : 'gain'
}

export function progressKgSinceStart(goal: Pick<WeightGoal, 'goal_type' | 'start_weight_kg' | 'current_weight_kg'>) {
  const delta = goal.current_weight_kg - goal.start_weight_kg

  if (goal.goal_type === 'lose') {
    return goal.start_weight_kg - goal.current_weight_kg
  }

  if (goal.goal_type === 'gain') {
    return goal.current_weight_kg - goal.start_weight_kg
  }

  return -Math.abs(delta)
}

export function milestoneStepFromProgress(progressKg: number, goalType: NutritionGoal) {
  if (goalType === 'maintain' || progressKg <= 0) {
    return 0
  }

  return Math.floor(progressKg / WEIGHT_MILESTONE_STEP_KG)
}

export function formatWeightKg(value: number) {
  return `${value.toFixed(1).replace('.', ',')} kg`
}

export function formatProgressSinceStart(goal: Pick<WeightGoal, 'goal_type' | 'start_weight_kg' | 'current_weight_kg'>) {
  const progress = progressKgSinceStart(goal)
  const formatted = formatWeightKg(Math.abs(progress))

  if (goal.goal_type === 'lose') {
    if (progress > 0) {
      return `−${formatted} depuis le début`
    }
    if (progress < 0) {
      return `+${formatted} depuis le début`
    }
    return 'Aucun changement depuis le début'
  }

  if (goal.goal_type === 'gain') {
    if (progress > 0) {
      return `+${formatted} depuis le début`
    }
    if (progress < 0) {
      return `−${formatted} depuis le début`
    }
    return 'Aucun changement depuis le début'
  }

  const delta = goal.current_weight_kg - goal.start_weight_kg
  if (Math.abs(delta) < 0.05) {
    return 'Poids stable depuis le début'
  }

  return `Écart de ${formatWeightKg(Math.abs(delta))} depuis le début`
}

export function hasNutritionBodyData(
  settings: Pick<
    NutritionSettings,
    'sex' | 'age' | 'height_cm' | 'weight_kg' | 'activity_level'
  > | null | undefined,
): settings is NutritionSettings & {
  sex: NonNullable<NutritionSettings['sex']>
  age: number
  height_cm: number
  weight_kg: number
  activity_level: NonNullable<NutritionSettings['activity_level']>
} {
  if (!settings) {
    return false
  }

  return (
    settings.sex != null &&
    settings.age != null &&
    settings.height_cm != null &&
    settings.weight_kg != null &&
    settings.activity_level != null
  )
}

export function suggestCalorieTarget(
  settings: NutritionSettings,
  goalType: NutritionGoal,
  weightKg: number,
) {
  if (!hasNutritionBodyData(settings)) {
    return null
  }

  const result = calculateTdee({
    sex: settings.sex,
    age: settings.age,
    heightCm: Number(settings.height_cm),
    weightKg,
    activityLevel: settings.activity_level,
    goal: goalType,
  })

  return {
    suggestedCalories: result.dailyTarget,
    tdee: result.tdee,
    currentCalories: settings.daily_calorie_target,
    delta: result.dailyTarget - settings.daily_calorie_target,
  }
}

export function shouldSuggestCalorieUpdate(
  suggestion: ReturnType<typeof suggestCalorieTarget>,
) {
  if (!suggestion) {
    return false
  }

  return Math.abs(suggestion.delta) >= CALORIE_SUGGESTION_THRESHOLD
}

export function clampWeightKg(value: number) {
  return Math.max(30, Math.min(300, Math.round(value * 10) / 10))
}

export function adjustWeightKg(current: number, deltaSteps: number) {
  return clampWeightKg(current + deltaSteps * WEIGHT_ADJUST_STEP_KG)
}

export type WeightGoalProjection = {
  weeklyRateKg: number
  remainingKg: number
  projectedDate: Date | null
  dailyDeficitKcal: number
  isReached: boolean
}

export function isWeightGoalReached(
  goal: Pick<WeightGoal, 'goal_type' | 'current_weight_kg' | 'target_weight_kg'>,
) {
  const threshold = WEIGHT_GOAL_MAINTAIN_THRESHOLD_KG

  if (goal.goal_type === 'lose') {
    return goal.current_weight_kg <= goal.target_weight_kg + threshold
  }

  if (goal.goal_type === 'gain') {
    return goal.current_weight_kg >= goal.target_weight_kg - threshold
  }

  return (
    Math.abs(goal.current_weight_kg - goal.target_weight_kg) < threshold
  )
}

export function remainingKgToTarget(
  goal: Pick<WeightGoal, 'goal_type' | 'current_weight_kg' | 'target_weight_kg'>,
) {
  if (isWeightGoalReached(goal)) {
    return 0
  }

  return Math.abs(goal.current_weight_kg - goal.target_weight_kg)
}

export function goalProgressPercent(
  goal: Pick<
    WeightGoal,
    'goal_type' | 'start_weight_kg' | 'current_weight_kg' | 'target_weight_kg'
  >,
) {
  const totalDelta = Math.abs(goal.start_weight_kg - goal.target_weight_kg)

  if (totalDelta < WEIGHT_GOAL_MAINTAIN_THRESHOLD_KG) {
    return 100
  }

  const progress = progressKgSinceStart(goal)
  return Math.min(100, Math.max(0, (progress / totalDelta) * 100))
}

export function resolveTdeeForProjection(
  settings: NutritionSettings & {
    sex: NonNullable<NutritionSettings['sex']>
    age: number
    height_cm: number
    weight_kg: number
    activity_level: NonNullable<NutritionSettings['activity_level']>
  },
  weightKg: number,
) {
  if (settings.tdee_calculated != null && settings.weight_kg === weightKg) {
    return settings.tdee_calculated
  }

  return calculateTdee({
    sex: settings.sex,
    age: settings.age,
    heightCm: Number(settings.height_cm),
    weightKg,
    activityLevel: settings.activity_level,
    goal: settings.goal ?? 'maintain',
  }).tdee
}

export function projectWeightGoalCompletion(
  goal: Pick<WeightGoal, 'goal_type' | 'current_weight_kg' | 'target_weight_kg'>,
  settings: NutritionSettings | null | undefined,
  now: Date = new Date(),
): WeightGoalProjection | null {
  if (!hasNutritionBodyData(settings) || goal.goal_type === 'maintain') {
    return null
  }

  const remainingKg = remainingKgToTarget(goal)

  if (isWeightGoalReached(goal)) {
    return {
      weeklyRateKg: 0,
      remainingKg: 0,
      projectedDate: null,
      dailyDeficitKcal: 0,
      isReached: true,
    }
  }

  const tdee = resolveTdeeForProjection(settings, goal.current_weight_kg)
  const dailyDeficitKcal = tdee - settings.daily_calorie_target

  if (goal.goal_type === 'lose' && dailyDeficitKcal <= 0) {
    return {
      weeklyRateKg: 0,
      remainingKg,
      projectedDate: null,
      dailyDeficitKcal,
      isReached: false,
    }
  }

  if (goal.goal_type === 'gain' && dailyDeficitKcal >= 0) {
    return {
      weeklyRateKg: 0,
      remainingKg,
      projectedDate: null,
      dailyDeficitKcal,
      isReached: false,
    }
  }

  const weeklyRateKg = (Math.abs(dailyDeficitKcal) * 7) / KCAL_PER_KG

  if (weeklyRateKg <= 0) {
    return {
      weeklyRateKg: 0,
      remainingKg,
      projectedDate: null,
      dailyDeficitKcal,
      isReached: false,
    }
  }

  const daysRemaining = Math.ceil((remainingKg / weeklyRateKg) * 7)
  const projectedDate = new Date(now)
  projectedDate.setDate(projectedDate.getDate() + daysRemaining)

  return {
    weeklyRateKg,
    remainingKg,
    projectedDate,
    dailyDeficitKcal,
    isReached: false,
  }
}

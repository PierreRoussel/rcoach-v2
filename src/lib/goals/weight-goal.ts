import { addWeeks, format, parseISO, startOfWeek } from 'date-fns'

import type { StoredUserMeasurements } from '@/lib/measurements/types'
import { calculateTdee } from '@/lib/nutrition/tdee'
import type { NutritionGoal, NutritionSettings } from '@/lib/nutrition/types'

export const WEIGHT_ADJUST_STEP_KG = 0.1
export const WEIGHT_MILESTONE_STEP_KG = 0.5
/** @deprecated Use WEIGHT_ADJUST_STEP_KG or WEIGHT_MILESTONE_STEP_KG */
export const WEIGHT_GOAL_STEP_KG = WEIGHT_MILESTONE_STEP_KG
export const WEIGHT_GOAL_MAINTAIN_THRESHOLD_KG = 0.25
/** Acceptable drift around the target for a maintain goal (UI + tracking). */
export const WEIGHT_GOAL_MAINTAIN_RANGE_KG = 1.5
export const CALORIE_SUGGESTION_THRESHOLD = 50
export const KCAL_PER_KG = 7700

export type WeightGoalRecord = {
  user_id: string
  target_weight_kg: number
  start_weight_kg: number
  goal_type: NutritionGoal
  last_milestone_step: number
  created_at: string
  updated_at: string
}

export type WeightGoal = WeightGoalRecord & {
  current_weight_kg: number
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

const WEEK_OPTS = { weekStartsOn: 1 as const }

export function isWeightGoalReinstitution(
  existing: Pick<WeightGoal, 'target_weight_kg'>,
  nextTargetKg: number,
) {
  return clampWeightKg(nextTargetKg) !== clampWeightKg(existing.target_weight_kg)
}

export function institutionWeightSnapshot(currentKg: number, targetKg: number) {
  const current = clampWeightKg(currentKg)
  const target = clampWeightKg(targetKg)

  return {
    start_weight_kg: current,
    target_weight_kg: target,
    goal_type: inferWeightGoalType(current, target),
    last_milestone_step: 0,
  }
}

export function seedGoalInstitutionWeek(
  weightByWeek: Map<string, number>,
  goal: Pick<WeightGoal, 'start_weight_kg' | 'created_at'>,
) {
  const startWeekKey = format(
    startOfWeek(parseISO(goal.created_at), WEEK_OPTS),
    'yyyy-MM-dd',
  )

  if (!weightByWeek.has(startWeekKey)) {
    weightByWeek.set(startWeekKey, clampWeightKg(goal.start_weight_kg))
  }

  return weightByWeek
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

export function formatProgressSinceStart(goal: Pick<WeightGoal, 'goal_type' | 'start_weight_kg' | 'current_weight_kg' | 'target_weight_kg'>) {
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

  const delta = maintainDriftKg(goal)
  if (Math.abs(delta) < 0.05) {
    return 'Sur la cible'
  }

  const driftLabel = formatWeightKg(Math.abs(delta))
  const direction = delta < 0 ? 'sous la cible' : 'au-dessus de la cible'

  if (isMaintainGoalInRange(goal)) {
    return `En range · ${driftLabel} ${direction}`
  }

  return `${driftLabel} ${direction}`
}

export function maintainDriftKg(
  goal: Pick<WeightGoal, 'current_weight_kg' | 'target_weight_kg'>,
) {
  return (
    clampWeightKg(goal.current_weight_kg) - clampWeightKg(goal.target_weight_kg)
  )
}

export function isMaintainGoalInRange(
  goal: Pick<WeightGoal, 'current_weight_kg' | 'target_weight_kg'>,
) {
  return Math.abs(maintainDriftKg(goal)) <= WEIGHT_GOAL_MAINTAIN_RANGE_KG
}

export type MaintainGoalDirection = 'center' | 'low' | 'high'

export type MaintainGoalDisplay = {
  inRange: boolean
  driftKg: number
  direction: MaintainGoalDirection
  /** 0–100 fill of one half of the centered gauge. */
  gaugeFillPercent: number
}

export function resolveMaintainGoalDisplay(
  goal: Pick<WeightGoal, 'current_weight_kg' | 'target_weight_kg'>,
): MaintainGoalDisplay {
  const driftKg = maintainDriftKg(goal)
  const absDrift = Math.abs(driftKg)

  let direction: MaintainGoalDirection = 'center'
  if (absDrift >= 0.05) {
    direction = driftKg < 0 ? 'low' : 'high'
  }

  return {
    inRange: absDrift <= WEIGHT_GOAL_MAINTAIN_RANGE_KG,
    driftKg,
    direction,
    gaugeFillPercent: Math.min(
      100,
      (absDrift / WEIGHT_GOAL_MAINTAIN_RANGE_KG) * 100,
    ),
  }
}

export function formatMaintainGoalStatusLabel(
  goal: Pick<WeightGoal, 'current_weight_kg' | 'target_weight_kg'>,
) {
  const display = resolveMaintainGoalDisplay(goal)

  if (display.inRange) {
    if (display.direction === 'center') {
      return 'En range'
    }

    const driftLabel = formatWeightKg(Math.abs(display.driftKg))
    return display.direction === 'low'
      ? `En range · ${driftLabel} en dessous`
      : `En range · ${driftLabel} au-dessus`
  }

  const driftLabel = formatWeightKg(Math.abs(display.driftKg))
  return display.direction === 'low'
    ? `${driftLabel} en dessous de la cible`
    : `${driftLabel} au-dessus de la cible`
}

export function isProgressOnTrack(
  goal: Pick<
    WeightGoal,
    'goal_type' | 'start_weight_kg' | 'current_weight_kg' | 'target_weight_kg'
  >,
) {
  if (goal.goal_type === 'maintain') {
    return isMaintainGoalInRange(goal)
  }

  return progressKgSinceStart(goal) > 0
}

export type ResolvedTdeeProfile = {
  sex: NutritionSex
  age: number
  heightCm: number
  weightKg: number
  activityLevel: NonNullable<NutritionSettings['activity_level']>
  dailyCalorieTarget: number
  goal: NutritionGoal
  tdeeCalculated: number | null
}

export function resolveTdeeProfile(
  measurements: StoredUserMeasurements | null | undefined,
  settings: Pick<
    NutritionSettings,
    'activity_level' | 'daily_calorie_target' | 'tdee_calculated'
  > | null | undefined,
  options: {
    weightKg: number
    goal: NutritionGoal
  },
): ResolvedTdeeProfile | null {
  if (!settings) {
    return null
  }

  const sex = measurements?.sex
  const age = measurements?.age
  const heightCm = measurements?.height_cm
  const activityLevel = settings.activity_level

  if (
    sex == null ||
    age == null ||
    heightCm == null ||
    options.weightKg == null ||
    activityLevel == null
  ) {
    return null
  }

  return {
    sex,
    age,
    heightCm: Number(heightCm),
    weightKg: options.weightKg,
    activityLevel,
    dailyCalorieTarget: settings.daily_calorie_target,
    goal: options.goal,
    tdeeCalculated: settings.tdee_calculated,
  }
}

export function hasTdeeProfileData(
  measurements: StoredUserMeasurements | null | undefined,
  settings: Pick<
    NutritionSettings,
    'activity_level' | 'daily_calorie_target'
  > | null | undefined,
  weightKg: number | null | undefined,
  goal: NutritionGoal = 'maintain',
) {
  if (weightKg == null) {
    return false
  }

  return (
    resolveTdeeProfile(measurements, settings, { weightKg, goal }) != null
  )
}

export function hasNutritionBodyData(
  measurements: StoredUserMeasurements | null | undefined,
  settings: Pick<NutritionSettings, 'activity_level'> | null | undefined,
  weightKg: number | null | undefined,
) {
  return hasTdeeProfileData(measurements, settings, weightKg)
}

export function suggestCalorieTarget(
  settings: NutritionSettings,
  goalType: NutritionGoal,
  weightKg: number,
  measurements?: StoredUserMeasurements | null,
) {
  const profile = resolveTdeeProfile(measurements, settings, {
    weightKg,
    goal: goalType,
  })
  if (!profile) {
    return null
  }

  const result = calculateTdee({
    sex: profile.sex,
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg,
    activityLevel: profile.activityLevel,
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
  const current = clampWeightKg(goal.current_weight_kg)
  const target = clampWeightKg(goal.target_weight_kg)

  if (goal.goal_type === 'lose') {
    return current <= target
  }

  if (goal.goal_type === 'gain') {
    return current >= target
  }

  return false
}

export function remainingKgToTarget(
  goal: Pick<WeightGoal, 'goal_type' | 'current_weight_kg' | 'target_weight_kg'>,
) {
  if (goal.goal_type === 'maintain') {
    const drift = Math.abs(maintainDriftKg(goal))
    return Math.max(0, drift - WEIGHT_GOAL_MAINTAIN_RANGE_KG)
  }

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
  profile: ResolvedTdeeProfile,
  weightKg: number,
) {
  if (profile.tdeeCalculated != null && profile.weightKg === weightKg) {
    return profile.tdeeCalculated
  }

  return calculateTdee({
    sex: profile.sex,
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg,
    activityLevel: profile.activityLevel,
    goal: profile.goal ?? 'maintain',
  }).tdee
}

export function projectWeightGoalCompletion(
  goal: Pick<WeightGoal, 'goal_type' | 'current_weight_kg' | 'target_weight_kg'>,
  settings: NutritionSettings | null | undefined,
  now: Date = new Date(),
  measurements?: StoredUserMeasurements | null,
): WeightGoalProjection | null {
  const profile = resolveTdeeProfile(measurements, settings, {
    weightKg: goal.current_weight_kg,
    goal: goal.goal_type,
  })

  if (!profile || goal.goal_type === 'maintain') {
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

  const tdee = resolveTdeeForProjection(profile, goal.current_weight_kg)
  const dailyDeficitKcal = tdee - profile.dailyCalorieTarget

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

export type GoalChartProjection = {
  projectedDate: Date
  weeklyRateKg: number
  isEstimate: boolean
}

export function resolveGoalChartProjection(
  goal: Pick<WeightGoal, 'goal_type' | 'current_weight_kg' | 'target_weight_kg'>,
  nutritionProjection: WeightGoalProjection | null,
  now: Date = new Date(),
): GoalChartProjection | null {
  if (goal.goal_type === 'maintain' || isWeightGoalReached(goal)) {
    return null
  }

  const remainingKg = remainingKgToTarget(goal)
  if (remainingKg <= 0) {
    return null
  }

  if (
    nutritionProjection?.projectedDate &&
    !nutritionProjection.isReached &&
    nutritionProjection.weeklyRateKg > 0
  ) {
    return {
      projectedDate: nutritionProjection.projectedDate,
      weeklyRateKg: nutritionProjection.weeklyRateKg,
      isEstimate: false,
    }
  }

  const defaultWeeklyRate = goal.goal_type === 'lose' ? 0.5 : 0.25
  const weeksRemaining = Math.max(1, Math.ceil(remainingKg / defaultWeeklyRate))
  const projectedDate = addWeeks(now, weeksRemaining)

  return {
    projectedDate,
    weeklyRateKg: remainingKg / weeksRemaining,
    isEstimate: true,
  }
}

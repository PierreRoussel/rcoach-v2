import {
  addWeeks,
  differenceInCalendarWeeks,
  eachWeekOfInterval,
  format,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { fr } from 'date-fns/locale'

import type { StoredUserMeasurements } from '@/lib/measurements/types'
import type { NutritionGoal, NutritionSettings } from '@/lib/nutrition/types'

import {
  clampWeightKg,
  institutionWeightSnapshot,
  projectWeightGoalCompletion,
  resolveGoalChartProjection,
  type GoalChartProjection,
  type WeightGoal,
  type WeightGoalProjection,
} from './weight-goal'

export type WeightGoalSetupCelebrationPayload = {
  goal: WeightGoal
  dailyCalorieTarget: number
  tdee: number
  userMeasurements?: StoredUserMeasurements | null
}

export type WeightGoalSetupCompletedEvent = {
  showCelebration: boolean
  payload?: WeightGoalSetupCelebrationPayload
}

export type WeightGoalSetupCelebrationInput = {
  mode: 'create' | 'edit'
  previousTargetKg?: number | null
  nextTargetKg: number
  goalType: NutritionGoal
}

export type ProjectionChartPoint = {
  weekKey: string
  weekLabel: string
  weight: number
}

export type WeightGoalSetupCelebrationCopy = {
  title: string
  subtitle: string
  description: string
  trajectoryTitle: string
  nutritionTitle: string
  energyLabel: string
  actionTitle: string
  rules: string[]
  backgroundClass: string
  accentTextClass: string
  accentBorderClass: string
  blobClass: string
}

const WEEK_OPTS = { weekStartsOn: 1 as const }
const MIN_CHART_POINTS = 4
const MAX_CHART_POINTS = 12

export function shouldShowWeightGoalSetupCelebration(
  input: WeightGoalSetupCelebrationInput,
): boolean {
  if (input.goalType !== 'lose' && input.goalType !== 'gain') {
    return false
  }

  if (input.mode === 'create') {
    return true
  }

  if (input.previousTargetKg == null) {
    return false
  }

  return clampWeightKg(input.previousTargetKg) !== clampWeightKg(input.nextTargetKg)
}

export function buildCelebrationGoalSnapshot(
  currentKg: number,
  targetKg: number,
  now: Date = new Date(),
): WeightGoal {
  const institution = institutionWeightSnapshot(currentKg, targetKg)
  const current = clampWeightKg(currentKg)

  return {
    user_id: '',
    target_weight_kg: institution.target_weight_kg,
    start_weight_kg: institution.start_weight_kg,
    current_weight_kg: current,
    goal_type: institution.goal_type,
    last_milestone_step: 0,
    projected_completion_at: null,
    projection_computed_at: null,
    projection_weekly_rate_kg: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  }
}

export function buildWeightGoalSetupCelebrationPayload(input: {
  currentKg: number
  targetKg: number
  dailyCalorieTarget: number
  tdee: number
  userMeasurements?: StoredUserMeasurements | null
  now?: Date
}): WeightGoalSetupCelebrationPayload | null {
  const goal = buildCelebrationGoalSnapshot(input.currentKg, input.targetKg, input.now)

  if (goal.goal_type === 'maintain') {
    return null
  }

  return {
    goal,
    dailyCalorieTarget: input.dailyCalorieTarget,
    tdee: input.tdee,
    userMeasurements: input.userMeasurements,
  }
}

export function resolveSetupCelebrationProjection(
  payload: WeightGoalSetupCelebrationPayload,
  nutritionSettings: NutritionSettings | null | undefined,
  now: Date = new Date(),
): {
  nutritionProjection: WeightGoalProjection | null
  chartProjection: GoalChartProjection | null
} {
  const settings: NutritionSettings | null = nutritionSettings
    ? {
        ...nutritionSettings,
        daily_calorie_target: payload.dailyCalorieTarget,
        tdee_calculated: payload.tdee,
      }
    : null

  const nutritionProjection = projectWeightGoalCompletion(
    payload.goal,
    settings,
    now,
    payload.userMeasurements,
  )

  const chartProjection = resolveGoalChartProjection(
    payload.goal,
    nutritionProjection,
    now,
  )

  return { nutritionProjection, chartProjection }
}

export function buildWeightGoalProjectionChartData(
  goal: Pick<WeightGoal, 'goal_type' | 'current_weight_kg' | 'target_weight_kg'>,
  chartProjection: GoalChartProjection | null,
  now: Date = new Date(),
): ProjectionChartPoint[] {
  const startWeight = clampWeightKg(goal.current_weight_kg)
  const targetWeight = clampWeightKg(goal.target_weight_kg)
  const today = startOfDay(now)

  if (goal.goal_type === 'maintain' || startWeight === targetWeight) {
    return [
      {
        weekKey: format(startOfWeek(today, WEEK_OPTS), 'yyyy-MM-dd'),
        weekLabel: format(today, 'd MMM', { locale: fr }),
        weight: startWeight,
      },
    ]
  }

  const projectedEnd = chartProjection?.projectedDate ?? addWeeks(today, 8)
  const rangeStart = startOfWeek(today, WEEK_OPTS)
  const rangeEnd = startOfWeek(projectedEnd, WEEK_OPTS)
  const weeks = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, WEEK_OPTS)
  const totalWeeks = Math.max(1, differenceInCalendarWeeks(rangeEnd, rangeStart, WEEK_OPTS))
  const step = Math.max(1, Math.ceil(weeks.length / MAX_CHART_POINTS))
  const sampledWeeks =
    weeks.length <= MIN_CHART_POINTS
      ? weeks
      : weeks.filter((_, index) => index % step === 0 || index === weeks.length - 1)

  const ensuredWeeks =
    sampledWeeks.length >= MIN_CHART_POINTS
      ? sampledWeeks
      : weeks.slice(0, Math.min(weeks.length, MIN_CHART_POINTS))

  return ensuredWeeks.map((weekStart, index) => {
    const progress =
      ensuredWeeks.length === 1 ? 1 : index / (ensuredWeeks.length - 1)
    const weight =
      Math.round((startWeight + (targetWeight - startWeight) * progress) * 10) / 10

    return {
      weekKey: format(weekStart, 'yyyy-MM-dd'),
      weekLabel: format(weekStart, 'd MMM', { locale: fr }),
      weight,
    }
  })
}

export function getWeightGoalSetupCelebrationCopy(
  goalType: Extract<NutritionGoal, 'lose' | 'gain'>,
): WeightGoalSetupCelebrationCopy {
  if (goalType === 'lose') {
    return {
      title: 'Votre objectif est fixé',
      subtitle: 'Perte de poids',
      description:
        'Vous avez défini une cible claire. Voici ce que cela implique pour la suite.',
      trajectoryTitle: 'Votre trajectoire estimée',
      nutritionTitle: 'Votre plan nutritionnel',
      energyLabel: 'Déficit journalier',
      actionTitle: 'Comment y arriver',
      rules: [
        'Pesez-vous régulièrement pour suivre la tendance, pas le jour isolé.',
        'Respectez votre déficit calorique au quotidien.',
        'Augmentez votre dépense : marche, sport, séances planifiées.',
      ],
      backgroundClass: 'bg-[#EFF6FF]',
      accentTextClass: 'text-[#1D4ED8]',
      accentBorderClass: 'border-blue-200/70',
      blobClass: 'bg-[#93C5FD]/45',
    }
  }

  return {
    title: 'Votre objectif est fixé',
    subtitle: 'Prise de masse',
    description:
      'Vous visez une progression maîtrisée. Voici les repères pour avancer sereinement.',
    trajectoryTitle: 'Votre trajectoire estimée',
    nutritionTitle: 'Votre plan nutritionnel',
    energyLabel: 'Surplus journalier',
    actionTitle: 'Comment y arriver',
    rules: [
      'Pesez-vous chaque semaine pour valider la tendance.',
      'Maintenez un surplus calorique régulier sans excès.',
      'Soutenez votre progression avec du sport et des séances structurées.',
    ],
    backgroundClass: 'bg-[#FFFBEB]',
    accentTextClass: 'text-[#B45309]',
    accentBorderClass: 'border-amber-200/70',
    blobClass: 'bg-[#FCD34D]/45',
  }
}

export function createPreviewWeightGoalSetupPayload(
  goalType: Extract<NutritionGoal, 'lose' | 'gain'>,
): WeightGoalSetupCelebrationPayload {
  const currentKg = 78
  const targetKg = goalType === 'lose' ? 72 : 82

  return {
    goal: buildCelebrationGoalSnapshot(currentKg, targetKg),
    dailyCalorieTarget: goalType === 'lose' ? 2100 : 2800,
    tdee: goalType === 'lose' ? 2400 : 2500,
    userMeasurements: {
      sex: 'male',
      age: 30,
      height_cm: 175,
      waist_cm: 84,
    },
  }
}

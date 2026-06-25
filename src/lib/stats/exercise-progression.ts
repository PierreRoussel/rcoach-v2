import {
  endOfMonth,
  endOfYear,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns'

import type { WorkoutSummary } from '@/lib/graphql/operations'
import { formatSetPerformanceSummary } from '@/lib/workout/format-set-performance'
import {
  bestHighRpeOneRm,
  bestHighRpeSet,
  bestSetByOneRm,
  buildHighRpeComparison,
  isWorkingSet,
  setEstimatedOneRm,
  type HighRpeComparison,
  type WorkoutSet,
} from '@/lib/stats/rpe-analytics'

export type StatsPeriod = '3m' | 'month' | 'year' | 'all'

export type PeriodRange = {
  start: Date | null
  end: Date
}

export type ExerciseCatalogEntry = {
  exerciseId: string
  name: string
  muscleGroup: string | null
  equipment: string | null
  sessionCount: number
  lastDate: string
  currentPerformance: string | null
}

export type ExerciseTimelinePoint = {
  date: string
  workoutId: string
  workoutTitle: string
  best1Rm: number | null
  topSetLabel: string | null
  avgRpe: number | null
  maxRpe: number | null
  sessionVolume: number
  highRpeBest1Rm: number | null
}

export type ExerciseSessionRow = {
  date: string
  workoutId: string
  workoutTitle: string
  topSetLabel: string | null
  maxRpe: number | null
  best1Rm: number | null
}

export type LoadMetric = 'weight' | 'reps'

export type LoadProgressComparison = {
  hasEnoughData: boolean
  metric: LoadMetric | null
  baselineValue: number | null
  currentValue: number | null
  baselineLabel: string | null
  currentLabel: string | null
  baselinePeriodLabel: string
  currentPeriodLabel: string
  delta: number | null
  deltaPercent: number | null
}

function parseWorkoutDate(value: string): Date {
  return startOfDay(parseISO(value))
}

export function resolvePeriodRange(
  period: StatsPeriod,
  now = new Date(),
): PeriodRange {
  const end = startOfDay(now)

  switch (period) {
    case '3m':
      return { start: startOfDay(subMonths(end, 3)), end }
    case 'month':
      return { start: startOfMonth(end), end: endOfMonth(end) }
    case 'year':
      return { start: startOfYear(end), end: endOfYear(end) }
    case 'all':
    default:
      return { start: null, end }
  }
}

export function isDateInRange(date: Date, range: PeriodRange): boolean {
  if (range.start && isBefore(date, range.start)) {
    return false
  }

  if (isAfter(date, range.end)) {
    return false
  }

  return true
}

function filterWorkoutsByRange(
  workouts: WorkoutSummary[],
  range: PeriodRange,
): WorkoutSummary[] {
  return workouts.filter((workout) =>
    isDateInRange(parseWorkoutDate(workout.started_at), range),
  )
}

function getExerciseEntries(
  workouts: WorkoutSummary[],
  exerciseId: string,
): Array<{
  workout: WorkoutSummary
  sets: WorkoutSet[]
  exerciseName: string
  muscleGroup: string | null
  equipment: string | null
}> {
  const entries: Array<{
    workout: WorkoutSummary
    sets: WorkoutSet[]
    exerciseName: string
    muscleGroup: string | null
    equipment: string | null
  }> = []

  for (const workout of workouts) {
    for (const exercise of workout.workout_exercises) {
      if (exercise.exercise.id !== exerciseId) {
        continue
      }

      entries.push({
        workout,
        sets: exercise.sets,
        exerciseName: exercise.exercise.name,
        muscleGroup: exercise.exercise.muscle_group,
        equipment: exercise.exercise.equipment,
      })
    }
  }

  return entries.sort(
    (left, right) =>
      parseWorkoutDate(right.workout.started_at).getTime() -
      parseWorkoutDate(left.workout.started_at).getTime(),
  )
}

function computeSessionVolume(sets: WorkoutSet[]): number {
  let volume = 0

  for (const set of sets) {
    if (!isWorkingSet(set)) {
      continue
    }

    if (set.weight_kg != null && set.reps != null) {
      volume += set.weight_kg * set.reps
    }
  }

  return volume
}

function averageRpe(sets: WorkoutSet[]): number | null {
  const values = sets
    .map((set) => set.rpe)
    .filter((value): value is number => value != null)

  if (values.length === 0) {
    return null
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function maxRpe(sets: WorkoutSet[]): number | null {
  const values = sets
    .map((set) => set.rpe)
    .filter((value): value is number => value != null)

  if (values.length === 0) {
    return null
  }

  return Math.max(...values)
}

function buildTimelinePoint(
  workout: WorkoutSummary,
  sets: WorkoutSet[],
): ExerciseTimelinePoint {
  const workingSets = sets.filter(isWorkingSet)
  const bestSet = bestSetByOneRm(workingSets)

  return {
    date: workout.started_at,
    workoutId: workout.id,
    workoutTitle: workout.title,
    best1Rm: bestSet ? setEstimatedOneRm(bestSet) : null,
    topSetLabel: bestSet
      ? formatSetPerformanceSummary(bestSet, { includeRpe: true })
      : null,
    avgRpe: averageRpe(workingSets),
    maxRpe: maxRpe(workingSets),
    sessionVolume: computeSessionVolume(sets),
    highRpeBest1Rm: bestHighRpeOneRm(workingSets),
  }
}

export function buildExerciseCatalog(
  workouts: WorkoutSummary[],
): ExerciseCatalogEntry[] {
  const byExercise = new Map<
    string,
    {
      exerciseId: string
      name: string
      muscleGroup: string | null
      equipment: string | null
      sessionCount: number
      lastDate: string
      lastSets: WorkoutSet[]
    }
  >()

  for (const workout of workouts) {
    for (const exercise of workout.workout_exercises) {
      const id = exercise.exercise.id
      const existing = byExercise.get(id)

      if (!existing) {
        byExercise.set(id, {
          exerciseId: id,
          name: exercise.exercise.name,
          muscleGroup: exercise.exercise.muscle_group,
          equipment: exercise.exercise.equipment,
          sessionCount: 1,
          lastDate: workout.started_at,
          lastSets: exercise.sets,
        })
        continue
      }

      existing.sessionCount += 1

      if (
        parseWorkoutDate(workout.started_at).getTime() >
        parseWorkoutDate(existing.lastDate).getTime()
      ) {
        existing.lastDate = workout.started_at
        existing.lastSets = exercise.sets
      }
    }
  }

  return [...byExercise.values()]
    .map((entry) => {
      const bestSet = bestSetByOneRm(entry.lastSets.filter(isWorkingSet))

      return {
        exerciseId: entry.exerciseId,
        name: entry.name,
        muscleGroup: entry.muscleGroup,
        equipment: entry.equipment,
        sessionCount: entry.sessionCount,
        lastDate: entry.lastDate,
        currentPerformance: bestSet
          ? formatSetPerformanceSummary(bestSet, { includeRpe: true })
          : null,
      } satisfies ExerciseCatalogEntry
    })
    .sort((left, right) => {
      if (right.sessionCount !== left.sessionCount) {
        return right.sessionCount - left.sessionCount
      }

      return left.name.localeCompare(right.name, 'fr')
    })
}

export function buildExerciseTimeline(
  workouts: WorkoutSummary[],
  exerciseId: string,
  period: StatsPeriod,
  now = new Date(),
): ExerciseTimelinePoint[] {
  const range = resolvePeriodRange(period, now)
  const filtered = filterWorkoutsByRange(workouts, range)
  const entries = getExerciseEntries(filtered, exerciseId)

  return entries
    .map((entry) => buildTimelinePoint(entry.workout, entry.sets))
    .sort((left, right) => left.date.localeCompare(right.date))
}

export function buildExerciseSessionRows(
  workouts: WorkoutSummary[],
  exerciseId: string,
  period: StatsPeriod,
  limit = 10,
  now = new Date(),
): ExerciseSessionRow[] {
  const timeline = buildExerciseTimeline(workouts, exerciseId, period, now)

  return timeline
    .slice(-limit)
    .reverse()
    .map((point) => ({
      date: point.date,
      workoutId: point.workoutId,
      workoutTitle: point.workoutTitle,
      topSetLabel: point.topSetLabel,
      maxRpe: point.maxRpe,
      best1Rm: point.best1Rm,
    }))
}

export function getBestPerformanceInPeriod(
  workouts: WorkoutSummary[],
  exerciseId: string,
  period: StatsPeriod,
  now = new Date(),
): { label: string | null; date: string | null; best1Rm: number | null } {
  const timeline = buildExerciseTimeline(workouts, exerciseId, period, now)
  let best: ExerciseTimelinePoint | null = null

  for (const point of timeline) {
    if (point.best1Rm == null) {
      continue
    }

    if (!best || (best.best1Rm ?? 0) < point.best1Rm) {
      best = point
    }
  }

  if (!best) {
    const latest = timeline.at(-1)
    return {
      label: latest?.topSetLabel ?? null,
      date: latest ? format(parseISO(latest.date), 'd MMM yyyy') : null,
      best1Rm: latest?.best1Rm ?? null,
    }
  }

  return {
    label: best.topSetLabel,
    date: format(parseISO(best.date), 'd MMM yyyy'),
    best1Rm: best.best1Rm,
  }
}

export function compareHighRpePerformance(
  workouts: WorkoutSummary[],
  exerciseId: string,
  period: StatsPeriod,
  now = new Date(),
): HighRpeComparison {
  const labels = getLoadComparisonPeriodLabels(period)
  const range = resolvePeriodRange(period, now)
  const entries = getExerciseEntries(
    filterWorkoutsByRange(workouts, range),
    exerciseId,
  ).sort(
    (left, right) =>
      parseWorkoutDate(left.workout.started_at).getTime() -
      parseWorkoutDate(right.workout.started_at).getTime(),
  )

  if (entries.length === 0) {
    return {
      ...buildHighRpeComparison(null, null),
      baselinePeriodLabel: labels.baseline,
      currentPeriodLabel: labels.current,
    }
  }

  const baselineSets: WorkoutSet[] = []
  const currentSets: WorkoutSet[] = []

  if (range.start) {
    const midpointMs =
      range.start.getTime() + (range.end.getTime() - range.start.getTime()) / 2

    for (const entry of entries) {
      const dateMs = parseWorkoutDate(entry.workout.started_at).getTime()
      const workingSets = entry.sets.filter(isWorkingSet)

      if (dateMs <= midpointMs) {
        baselineSets.push(...workingSets)
      } else {
        currentSets.push(...workingSets)
      }
    }
  } else {
    const splitIndex = Math.max(1, Math.ceil(entries.length / 2))

    for (const [index, entry] of entries.entries()) {
      const workingSets = entry.sets.filter(isWorkingSet)

      if (index < splitIndex) {
        baselineSets.push(...workingSets)
      } else {
        currentSets.push(...workingSets)
      }
    }
  }

  const currentBest = bestHighRpeSet(currentSets)
  const baselineBest = bestHighRpeSet(baselineSets)

  return {
    ...buildHighRpeComparison(
      currentBest ? setEstimatedOneRm(currentBest) : null,
      baselineBest ? setEstimatedOneRm(baselineBest) : null,
      currentBest
        ? formatSetPerformanceSummary(currentBest, { includeRpe: true })
        : null,
      baselineBest
        ? formatSetPerformanceSummary(baselineBest, { includeRpe: true })
        : null,
    ),
    baselinePeriodLabel: labels.baseline,
    currentPeriodLabel: labels.current,
  }
}

export function findExerciseInCatalog(
  catalog: ExerciseCatalogEntry[],
  exerciseId: string,
): ExerciseCatalogEntry | undefined {
  return catalog.find((entry) => entry.exerciseId === exerciseId)
}

function getLoadComparisonPeriodLabels(period: StatsPeriod): {
  baseline: string
  current: string
} {
  switch (period) {
    case '3m':
      return { baseline: 'Il y a 3 mois', current: "Aujourd'hui" }
    case 'month':
      return { baseline: 'Début du mois', current: "Aujourd'hui" }
    case 'year':
      return { baseline: "Début d'année", current: "Aujourd'hui" }
    case 'all':
    default:
      return { baseline: 'Au debut', current: 'Maintenant' }
  }
}

function bestLoadFromSets(
  sets: WorkoutSet[],
): { metric: LoadMetric; value: number; label: string } | null {
  const working = sets.filter(isWorkingSet)
  let bestWeight = 0
  let bestReps = 0

  for (const set of working) {
    const weight = set.weight_kg ?? 0
    const reps = set.reps ?? 0

    if (weight > bestWeight) {
      bestWeight = weight
    }

    if (weight <= 0 && reps > bestReps) {
      bestReps = reps
    }
  }

  if (bestWeight > 0) {
    return {
      metric: 'weight',
      value: bestWeight,
      label: `${bestWeight} kg`,
    }
  }

  if (bestReps > 0) {
    return {
      metric: 'reps',
      value: bestReps,
      label: `${bestReps} reps`,
    }
  }

  return null
}

function emptyLoadComparison(period: StatsPeriod): LoadProgressComparison {
  const labels = getLoadComparisonPeriodLabels(period)

  return {
    hasEnoughData: false,
    metric: null,
    baselineValue: null,
    currentValue: null,
    baselineLabel: null,
    currentLabel: null,
    baselinePeriodLabel: labels.baseline,
    currentPeriodLabel: labels.current,
    delta: null,
    deltaPercent: null,
  }
}

export function compareBestLoadProgression(
  workouts: WorkoutSummary[],
  exerciseId: string,
  period: StatsPeriod,
  now = new Date(),
): LoadProgressComparison {
  const labels = getLoadComparisonPeriodLabels(period)
  const range = resolvePeriodRange(period, now)
  const entries = getExerciseEntries(
    filterWorkoutsByRange(workouts, range),
    exerciseId,
  ).sort(
    (left, right) =>
      parseWorkoutDate(left.workout.started_at).getTime() -
      parseWorkoutDate(right.workout.started_at).getTime(),
  )

  if (entries.length === 0) {
    return emptyLoadComparison(period)
  }

  const baselineSets: WorkoutSet[] = []
  const currentSets: WorkoutSet[] = []

  if (range.start) {
    const midpointMs =
      range.start.getTime() + (range.end.getTime() - range.start.getTime()) / 2

    for (const entry of entries) {
      const dateMs = parseWorkoutDate(entry.workout.started_at).getTime()
      if (dateMs <= midpointMs) {
        baselineSets.push(...entry.sets)
      } else {
        currentSets.push(...entry.sets)
      }
    }
  } else {
    const splitIndex = Math.max(1, Math.ceil(entries.length / 2))
    for (const [index, entry] of entries.entries()) {
      if (index < splitIndex) {
        baselineSets.push(...entry.sets)
      } else {
        currentSets.push(...entry.sets)
      }
    }
  }

  const baselineLoad = bestLoadFromSets(baselineSets)
  const currentLoad = bestLoadFromSets(currentSets)

  if (!baselineLoad || !currentLoad || baselineLoad.metric !== currentLoad.metric) {
    return {
      ...emptyLoadComparison(period),
      baselineLabel: baselineLoad?.label ?? null,
      currentLabel: currentLoad?.label ?? null,
      baselineValue: baselineLoad?.value ?? null,
      currentValue: currentLoad?.value ?? null,
      metric: baselineLoad?.metric ?? currentLoad?.metric ?? null,
    }
  }

  const delta = currentLoad.value - baselineLoad.value
  const deltaPercent =
    baselineLoad.value > 0
      ? Math.round((delta / baselineLoad.value) * 1000) / 10
      : null

  return {
    hasEnoughData: true,
    metric: baselineLoad.metric,
    baselineValue: baselineLoad.value,
    currentValue: currentLoad.value,
    baselineLabel: baselineLoad.label,
    currentLabel: currentLoad.label,
    baselinePeriodLabel: labels.baseline,
    currentPeriodLabel: labels.current,
    delta,
    deltaPercent,
  }
}

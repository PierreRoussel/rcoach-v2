import type { Exercise } from '@/lib/graphql/operations'
import { getExerciseTrackingKind } from '@/lib/workout/exercise-tracking'

export type SetSnapshot = {
  set_index: number
  set_type: string
  weight_kg: number | null
  reps: number | null
  rpe?: number | null
  duration_seconds?: number | null
  distance_km?: number | null
}

export type ExerciseKind =
  | 'weighted'
  | 'bodyweight'
  | 'cardio'
  | 'timed'
  | 'band'

export type PerformanceSummary = {
  date: string
  workoutTitle: string
  /** Dernière série de travail (référence RPE / surcharge). */
  bestSet: SetSnapshot | null
  allSets: SetSnapshot[]
}

export type OverloadSuggestion = {
  kind: ExerciseKind
  message: string
  suggestedWeightKg: number | null
  suggestedReps: number | null
  suggestedDurationSeconds: number | null
  suggestedDistanceKm: number | null
  /** false = message informatif (RPE trop élevé, RPE manquant). */
  actionable: boolean
}

export const MAX_RPE_FOR_PROGRESSION = 9

const ISOLATION_MUSCLE_GROUPS = new Set([
  'biceps',
  'triceps',
  'shoulders',
  'abs',
])

const ISOLATION_NAME_PATTERN =
  /curl|extension|raise|fly|kickback|pushdown|skull|lateral|triceps|biceps/i

type ProgressionProfile = {
  type: 'isolation' | 'compound'
  repCeiling: number
  repMin: number
  resolveWeightIncrementKg: (weight: number, equipment: string) => number
}

function normalizeExerciseName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase()
}

export function isWarmUpExerciseName(name: string): boolean {
  const normalized = normalizeExerciseName(name)
  return (
    normalized === 'echauffement' ||
    normalized === 'warm up' ||
    normalized === 'warmup'
  )
}

export function classifyExercise(exercise: Pick<Exercise, 'name' | 'equipment'>): ExerciseKind {
  const name = exercise.name.toLowerCase()
  const equipment = exercise.equipment?.toLowerCase() ?? ''

  if (
    name.includes('plank') ||
    name.includes('planche') ||
    name.includes('gainage') ||
    name.includes('chaise') ||
    name.includes('wall sit') ||
    name.includes('hollow') ||
    name.includes('isometr') ||
    name.includes('warm up') ||
    name.includes('stretch') ||
    name.includes('hold')
  ) {
    return 'timed'
  }

  if (
    equipment === 'bodyweight' ||
    name.includes('pull up') ||
    name.includes('chin up') ||
    name.includes('push up') ||
    name.includes('dip')
  ) {
    return 'bodyweight'
  }

  if (equipment === 'band' || name.includes('band')) {
    return 'band'
  }

  if (
    name.includes('run') ||
    name.includes('rower') ||
    name.includes('bike') ||
    name.includes('vélo') ||
    name.includes('velo') ||
    equipment === 'cardio'
  ) {
    return 'cardio'
  }

  return 'weighted'
}

export function resolveProgressionProfile(
  exercise: Pick<Exercise, 'name' | 'equipment' | 'muscle_group'>,
): ProgressionProfile {
  const muscle = exercise.muscle_group?.toLowerCase() ?? ''
  const name = exercise.name.toLowerCase()
  const equipment = exercise.equipment?.toLowerCase() ?? ''

  const isIsolation =
    ISOLATION_MUSCLE_GROUPS.has(muscle) || ISOLATION_NAME_PATTERN.test(name)

  if (isIsolation) {
    return {
      type: 'isolation',
      repCeiling: 12,
      repMin: 8,
      resolveWeightIncrementKg: () => 1,
    }
  }

  return {
    type: 'compound',
    repCeiling: 8,
    repMin: 6,
    resolveWeightIncrementKg: (weight) =>
      equipment === 'barbell' && weight >= 80 ? 5 : 2.5,
  }
}

function workingSets(sets: SetSnapshot[]) {
  return sets.filter(
    (set) => set.set_type !== 'warmup' && (set.reps != null || set.duration_seconds != null),
  )
}

function resolveTimedKind(candidates: SetSnapshot[]): ExerciseKind {
  return candidates.every(
    (set) =>
      (set.duration_seconds ?? 0) > 0 &&
      (set.reps == null || set.reps === 0) &&
      (set.weight_kg == null || set.weight_kg === 0),
  )
    ? 'timed'
    : 'weighted'
}

/** Dernière série de travail (ordre set_index), excluant l'échauffement. */
export function lastWorkingSet(
  sets: SetSnapshot[],
  kind?: ExerciseKind,
): SetSnapshot | null {
  const candidates = workingSets(sets).sort((left, right) => left.set_index - right.set_index)
  if (candidates.length === 0) {
    return null
  }

  const resolvedKind = kind ?? resolveTimedKind(candidates)
  if (resolvedKind === 'timed') {
    return candidates[candidates.length - 1] ?? null
  }

  return candidates[candidates.length - 1] ?? null
}

function formatRpeSuffix(rpe: number | null | undefined): string {
  if (rpe == null) {
    return ''
  }

  const value = Number.isInteger(rpe) ? String(rpe) : String(rpe)
  return ` @ ${value}`
}

export function formatLastSessionReference(best: SetSnapshot): string {
  if (best.weight_kg != null && best.reps != null) {
    return `${best.weight_kg} kg x ${best.reps}${formatRpeSuffix(best.rpe)}`
  }

  if (best.reps != null) {
    return `${best.reps} reps${formatRpeSuffix(best.rpe)}`
  }

  if (best.duration_seconds != null) {
    return `${best.duration_seconds}s${formatRpeSuffix(best.rpe)}`
  }

  if (best.distance_km != null) {
    return `${best.distance_km} km${formatRpeSuffix(best.rpe)}`
  }

  return ''
}

export function summarizePerformance(
  workoutTitle: string,
  startedAt: string,
  sets: SetSnapshot[],
  exercise?: Pick<Exercise, 'name' | 'equipment' | 'tracking_mode'>,
): PerformanceSummary {
  const kind = exercise
    ? getExerciseTrackingKind({
        name: exercise.name,
        equipment: exercise.equipment,
        tracking_mode: exercise.tracking_mode,
      })
    : undefined

  return {
    date: startedAt,
    workoutTitle,
    bestSet: lastWorkingSet(sets, kind),
    allSets: sets,
  }
}

function bodyweightRepStats(sets: SetSnapshot[]): {
  best: number
  min: number
  workingCount: number
} | null {
  const reps = workingSets(sets)
    .map((set) => set.reps)
    .filter((rep): rep is number => rep != null && rep > 0)

  if (reps.length === 0) {
    return null
  }

  return {
    best: Math.max(...reps),
    min: Math.min(...reps),
    workingCount: reps.length,
  }
}

export function formatBodyweightSessionReference(sets: SetSnapshot[]): string {
  const working = workingSets(sets)
  const reps = working
    .map((set) => set.reps)
    .filter((rep): rep is number => rep != null && rep > 0)

  if (reps.length === 0) {
    return ''
  }

  if (reps.length === 1) {
    return `${reps[0]} reps${formatRpeSuffix(working[0]?.rpe)}`
  }

  const best = Math.max(...reps)
  if (reps.every((rep) => rep === best)) {
    return `${reps.length} x ${best} reps`
  }

  return reps.join(', ') + ' reps'
}

function buildRpeBlockedSuggestion(
  kind: ExerciseKind,
  referenceSet: SetSnapshot,
): OverloadSuggestion {
  const lastSession = formatLastSessionReference(referenceSet)
  const rpe = referenceSet.rpe

  return {
    kind,
    message:
      rpe != null
        ? `Dernière séance : ${lastSession}. RPE ${Number.isInteger(rpe) ? rpe : rpe} — consolidez avant d'augmenter.`
        : `Dernière séance : ${lastSession}. Consolidez avant d'augmenter.`,
    suggestedWeightKg: null,
    suggestedReps: null,
    suggestedDurationSeconds: null,
    suggestedDistanceKm: null,
    actionable: false,
  }
}

function buildMissingRpeSuggestion(
  kind: ExerciseKind,
  referenceSet: SetSnapshot,
): OverloadSuggestion {
  const lastSession = formatLastSessionReference(referenceSet)

  return {
    kind,
    message: `Dernière séance : ${lastSession}. Indiquez un RPE sur la dernière série pour obtenir une suggestion.`,
    suggestedWeightKg: null,
    suggestedReps: null,
    suggestedDurationSeconds: null,
    suggestedDistanceKm: null,
    actionable: false,
  }
}

function checkRpeProgressionGate(
  kind: ExerciseKind,
  referenceSet: SetSnapshot,
  options?: { rpeEnabled?: boolean },
): OverloadSuggestion | null {
  const rpe = referenceSet.rpe

  if (rpe != null && rpe >= MAX_RPE_FOR_PROGRESSION) {
    return buildRpeBlockedSuggestion(kind, referenceSet)
  }

  if (options?.rpeEnabled && rpe == null) {
    return buildMissingRpeSuggestion(kind, referenceSet)
  }

  return null
}

function suggestBodyweightOverload(
  last: PerformanceSummary,
  bodyWeightKg?: number | null,
  options?: { rpeEnabled?: boolean },
): OverloadSuggestion | null {
  const referenceSet = last.bestSet
  if (!referenceSet) {
    return null
  }

  const rpeGate = checkRpeProgressionGate('bodyweight', referenceSet, options)
  if (rpeGate) {
    return rpeGate
  }

  const stats = bodyweightRepStats(last.allSets)
  if (!stats) {
    return null
  }

  const { best, min } = stats
  const lastSession = formatBodyweightSessionReference(last.allSets)
  const kind = 'bodyweight' as const

  if (min < best) {
    return {
      kind,
      message: `Dernière séance : ${lastSession}. Viser ${best} reps sur chaque série.`,
      suggestedWeightKg: referenceSet.weight_kg ?? null,
      suggestedReps: best,
      suggestedDurationSeconds: null,
      suggestedDistanceKm: null,
      actionable: true,
    }
  }

  const targetReps = best + 1
  const conservative =
    bodyWeightKg != null && bodyWeightKg > 0 && best <= 8

  return {
    kind,
    message: conservative
      ? `Dernière séance : ${lastSession}. Viser ${targetReps} rep${targetReps > 1 ? 's' : ''} si toutes les séries restent propres.`
      : `Dernière séance : ${lastSession}. Viser ${targetReps} rep${targetReps > 1 ? 's' : ''}.`,
    suggestedWeightKg: referenceSet.weight_kg ?? null,
    suggestedReps: targetReps,
    suggestedDurationSeconds: null,
    suggestedDistanceKm: null,
    actionable: true,
  }
}

function suggestWeightedOverload(
  exercise: Pick<Exercise, 'name' | 'equipment' | 'muscle_group'>,
  referenceSet: SetSnapshot,
  options?: { rpeEnabled?: boolean },
): OverloadSuggestion | null {
  const kind = 'weighted' as const
  const rpeGate = checkRpeProgressionGate(kind, referenceSet, options)
  if (rpeGate) {
    return rpeGate
  }

  const weight = referenceSet.weight_kg ?? 0
  const reps = referenceSet.reps ?? 0
  if (weight <= 0 || reps <= 0) {
    return null
  }

  const lastSession = formatLastSessionReference(referenceSet)
  const profile = resolveProgressionProfile(exercise)
  const equipment = exercise.equipment?.toLowerCase() ?? ''

  if (reps < profile.repCeiling) {
    return {
      kind,
      message: `Dernière séance : ${lastSession}. +1 rep à ${weight} kg.`,
      suggestedWeightKg: weight,
      suggestedReps: reps + 1,
      suggestedDurationSeconds: null,
      suggestedDistanceKm: null,
      actionable: true,
    }
  }

  const increment = profile.resolveWeightIncrementKg(weight, equipment)
  const targetReps = Math.max(reps - 1, profile.repMin)

  return {
    kind,
    message: `Dernière séance : ${lastSession}. Plafond atteint — +${increment} kg à ${targetReps} reps.`,
    suggestedWeightKg: weight + increment,
    suggestedReps: targetReps,
    suggestedDurationSeconds: null,
    suggestedDistanceKm: null,
    actionable: true,
  }
}

export function suggestProgressiveOverload(
  exercise: Pick<Exercise, 'name' | 'equipment' | 'tracking_mode' | 'muscle_group'>,
  last: PerformanceSummary | null,
  options?: { bodyWeightKg?: number | null; rpeEnabled?: boolean },
): OverloadSuggestion | null {
  if (isWarmUpExerciseName(exercise.name)) {
    return null
  }

  if (!last?.bestSet) {
    return null
  }

  const kind = getExerciseTrackingKind(exercise)
  const referenceSet = last.bestSet
  const lastSession = formatLastSessionReference(referenceSet)

  switch (kind) {
    case 'weighted':
      return suggestWeightedOverload(exercise, referenceSet, options)

    case 'bodyweight':
      return suggestBodyweightOverload(last, options?.bodyWeightKg, options)

    case 'band': {
      const rpeGate = checkRpeProgressionGate('band', referenceSet, options)
      if (rpeGate) {
        return rpeGate
      }

      const reps = referenceSet.reps ?? 0
      return {
        kind,
        message: reps
          ? `Dernière séance : ${lastSession}. Ajouter 1-2 reps ou une tension supérieure.`
          : 'Augmenter legerement la tension ou les reps.',
        suggestedWeightKg: null,
        suggestedReps: reps ? reps + 1 : null,
        suggestedDurationSeconds: null,
        suggestedDistanceKm: null,
        actionable: true,
      }
    }

    case 'cardio': {
      const distance = referenceSet.distance_km ?? null
      const duration = referenceSet.duration_seconds ?? null
      if (distance != null) {
        return {
          kind,
          message: `Dernière séance : ${lastSession}. Viser +0.2 km à allure similaire.`,
          suggestedWeightKg: null,
          suggestedReps: null,
          suggestedDurationSeconds: duration,
          suggestedDistanceKm: Math.round((distance + 0.2) * 100) / 100,
          actionable: true,
        }
      }

      if (duration != null) {
        return {
          kind,
          message: `Dernière séance : ${lastSession}. Viser +2 min.`,
          suggestedWeightKg: null,
          suggestedReps: null,
          suggestedDurationSeconds: duration + 120,
          suggestedDistanceKm: null,
          actionable: true,
        }
      }

      return null
    }

    case 'timed': {
      const duration = referenceSet.duration_seconds ?? 0
      if (duration <= 0) {
        return null
      }

      return {
        kind,
        message: `Dernière séance : ${lastSession}. Viser ${duration + 10}s.`,
        suggestedWeightKg: null,
        suggestedReps: null,
        suggestedDurationSeconds: duration + 10,
        suggestedDistanceKm: null,
        actionable: true,
      }
    }

    default:
      return null
  }
}

export function isWorkingSet(set: { setType?: string; set_type?: string }) {
  const setType = set.setType ?? set.set_type ?? 'normal'
  return setType !== 'warmup'
}

type OverloadSetFields = {
  setType?: string
  weightKg?: number | null
  reps?: number | null
  durationSeconds?: number | null
  distanceKm?: number | null
}

export function applyOverloadToWorkingSets<T extends OverloadSetFields>(
  sets: T[],
  suggestion: OverloadSuggestion,
): T[] {
  if (!suggestion.actionable) {
    return sets
  }

  return sets.map((set) => {
    if (!isWorkingSet(set)) {
      return set
    }

    return {
      ...set,
      ...(suggestion.suggestedWeightKg != null
        ? { weightKg: suggestion.suggestedWeightKg }
        : {}),
      ...(suggestion.suggestedReps != null ? { reps: suggestion.suggestedReps } : {}),
      ...(suggestion.suggestedDurationSeconds != null
        ? { durationSeconds: suggestion.suggestedDurationSeconds }
        : {}),
      ...(suggestion.suggestedDistanceKm != null
        ? { distanceKm: suggestion.suggestedDistanceKm }
        : {}),
    }
  })
}

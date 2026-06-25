import type { Exercise } from '@/lib/graphql/operations'

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
}

export function classifyExercise(exercise: Pick<Exercise, 'name' | 'equipment'>): ExerciseKind {
  const name = exercise.name.toLowerCase()
  const equipment = exercise.equipment?.toLowerCase() ?? ''

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

  if (
    name.includes('plank') ||
    name.includes('warm up') ||
    name.includes('stretch') ||
    name.includes('hold')
  ) {
    return 'timed'
  }

  return 'weighted'
}

function workingSets(sets: SetSnapshot[]) {
  return sets.filter(
    (set) => set.set_type !== 'warmup' && (set.reps != null || set.duration_seconds != null),
  )
}

function bestWorkingSet(sets: SetSnapshot[]) {
  const candidates = workingSets(sets)
  if (candidates.length === 0) {
    return null
  }

  return candidates.reduce((best, current) => {
    const bestScore = (best.weight_kg ?? 0) * (best.reps ?? 0)
    const currentScore = (current.weight_kg ?? 0) * (current.reps ?? 0)
    if (currentScore > bestScore) {
      return current
    }
    if (currentScore === bestScore && (current.reps ?? 0) > (best.reps ?? 0)) {
      return current
    }
    return best
  })
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
): PerformanceSummary {
  return {
    date: startedAt,
    workoutTitle,
    bestSet: bestWorkingSet(sets),
    allSets: sets,
  }
}

export function suggestProgressiveOverload(
  exercise: Pick<Exercise, 'name' | 'equipment'>,
  last: PerformanceSummary | null,
): OverloadSuggestion | null {
  if (!last?.bestSet) {
    return null
  }

  const kind = classifyExercise(exercise)
  const best = last.bestSet
  const lastSession = formatLastSessionReference(best)

  switch (kind) {
    case 'weighted': {
      const weight = best.weight_kg ?? 0
      const reps = best.reps ?? 0
      if (weight <= 0 || reps <= 0) {
        return null
      }

      if (reps >= 8) {
        const increment = weight >= 80 ? 5 : 2.5
        return {
          kind,
          message: `Derniere seance : ${lastSession}. Essayer ${weight + increment} kg x ${Math.max(reps - 1, 6)} reps.`,
          suggestedWeightKg: weight + increment,
          suggestedReps: Math.max(reps - 1, 6),
          suggestedDurationSeconds: null,
          suggestedDistanceKm: null,
        }
      }

      return {
        kind,
        message: `Derniere seance : ${lastSession}. Viser ${weight} kg x ${reps + 1} reps.`,
        suggestedWeightKg: weight,
        suggestedReps: reps + 1,
        suggestedDurationSeconds: null,
        suggestedDistanceKm: null,
      }
    }

    case 'bodyweight': {
      const reps = best.reps ?? 0
      if (reps <= 0) {
        return null
      }

      return {
        kind,
        message: `Derniere seance : ${lastSession}. Viser ${reps + 1} a ${reps + 2} reps.`,
        suggestedWeightKg: best.weight_kg,
        suggestedReps: reps + 1,
        suggestedDurationSeconds: null,
        suggestedDistanceKm: null,
      }
    }

    case 'band': {
      const reps = best.reps ?? 0
      return {
        kind,
        message: reps
          ? `Derniere seance : ${lastSession}. Ajouter 1-2 reps ou une tension superieure.`
          : 'Augmenter legerement la tension ou les reps.',
        suggestedWeightKg: null,
        suggestedReps: reps ? reps + 1 : null,
        suggestedDurationSeconds: null,
        suggestedDistanceKm: null,
      }
    }

    case 'cardio': {
      const distance = best.distance_km ?? null
      const duration = best.duration_seconds ?? null
      if (distance != null) {
        return {
          kind,
          message: `Derniere seance : ${lastSession}. Viser +0.2 km a allure similaire.`,
          suggestedWeightKg: null,
          suggestedReps: null,
          suggestedDurationSeconds: duration,
          suggestedDistanceKm: Math.round((distance + 0.2) * 100) / 100,
        }
      }

      if (duration != null) {
        return {
          kind,
          message: `Derniere seance : ${lastSession}. Viser +2 min.`,
          suggestedWeightKg: null,
          suggestedReps: null,
          suggestedDurationSeconds: duration + 120,
          suggestedDistanceKm: null,
        }
      }

      return null
    }

    case 'timed': {
      const duration = best.duration_seconds ?? 0
      if (duration <= 0) {
        return null
      }

      return {
        kind,
        message: `Derniere seance : ${lastSession}. Viser ${duration + 10}s.`,
        suggestedWeightKg: null,
        suggestedReps: null,
        suggestedDurationSeconds: duration + 10,
        suggestedDistanceKm: null,
      }
    }

    default:
      return null
  }
}

export function isWorkingSet(set: { setType?: string }) {
  return (set.setType ?? 'normal') !== 'warmup'
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

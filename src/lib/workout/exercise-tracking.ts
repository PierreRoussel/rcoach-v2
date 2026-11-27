import type { Exercise } from '@/lib/graphql/operations'
import {
  classifyExercise,
  type ExerciseKind,
} from '@/lib/workout/progressive-overload'

export type ExerciseTrackingMode =
  | 'auto'
  | 'weighted'
  | 'bodyweight'
  | 'timed'
  | 'cardio'
  | 'loaded_timed'

export type ExerciseTrackingSource = {
  name: string
  equipment?: string | null
  tracking_mode?: ExerciseTrackingMode | string | null
  trackingMode?: ExerciseTrackingMode | string | null
}

export function getExerciseTrackingKind(
  exercise: ExerciseTrackingSource,
): ExerciseKind {
  const mode = exercise.tracking_mode ?? exercise.trackingMode
  if (mode && mode !== 'auto') {
    return mode as ExerciseKind
  }

  return classifyExercise({
    name: exercise.name,
    equipment: exercise.equipment ?? null,
  })
}

/** Hold / chrono isométrique : timed pur et charge+durée. */
export function isHoldCapableExercise(exercise: ExerciseTrackingSource): boolean {
  const kind = getExerciseTrackingKind(exercise)
  return kind === 'timed' || kind === 'loaded_timed'
}

/** @deprecated Prefer isHoldCapableExercise — kept for timed-only callers. */
export function isTimedExercise(exercise: ExerciseTrackingSource): boolean {
  return getExerciseTrackingKind(exercise) === 'timed'
}

export function toExerciseTrackingSource(
  exercise: Pick<Exercise, 'name' | 'equipment'> & {
    tracking_mode?: string | null
  },
): ExerciseTrackingSource {
  return {
    name: exercise.name,
    equipment: exercise.equipment,
    tracking_mode: exercise.tracking_mode ?? null,
  }
}

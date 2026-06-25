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

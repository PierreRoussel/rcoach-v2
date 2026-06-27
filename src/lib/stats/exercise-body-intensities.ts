import { normalizeMuscleGroup } from '@/lib/stats/muscle-groups'
import type { MuscleGroup } from '@/lib/workout/exercise-meta'

const EMPTY_BODY_INTENSITIES: Record<string, number> = {
  chest: 0,
  abs: 0,
  shoulders: 0,
  biceps: 0,
  triceps: 0,
  back: 0,
  glutes: 0,
  legs: 0,
  forearms: 0,
  calves: 0,
}

export type WorkoutExerciseForBodyIntensities = {
  muscleGroup?: string | null
  sets: Array<{
    setType?: string | null
    weightKg?: number | null
    reps?: number | null
    completedAt?: string | null
  }>
}

function getExerciseWorkScore(exercise: WorkoutExerciseForBodyIntensities): number {
  let volume = 0
  let sets = 0

  for (const set of exercise.sets) {
    if (set.setType === 'warmup') {
      continue
    }
    if (set.reps == null || set.reps <= 0) {
      continue
    }
    if (!set.completedAt) {
      continue
    }

    sets += 1
    volume += (set.weightKg ?? 0) * set.reps
  }

  return volume > 0 ? volume : sets
}

export function computeWorkoutBodyIntensities(
  exercises: WorkoutExerciseForBodyIntensities[],
): Record<string, number> {
  const merged = { ...EMPTY_BODY_INTENSITIES }

  for (const exercise of exercises) {
    const score = getExerciseWorkScore(exercise)
    if (score <= 0) {
      continue
    }

    const partial = getExerciseBodyIntensities(exercise.muscleGroup)
    for (const key of Object.keys(merged)) {
      merged[key] += (partial[key] ?? 0) * score
    }
  }

  const max = Math.max(...Object.values(merged), 0)
  if (max <= 0) {
    return { ...EMPTY_BODY_INTENSITIES }
  }

  return Object.fromEntries(
    Object.entries(merged).map(([key, value]) => [key, value / max]),
  )
}

export function getExerciseBodyIntensities(
  muscleGroup: string | null | undefined,
): Record<string, number> {
  const muscle = normalizeMuscleGroup(muscleGroup)

  const intensities: Record<string, number> = {
    chest: 0,
    abs: 0,
    shoulders: 0,
    biceps: 0,
    triceps: 0,
    back: 0,
    glutes: 0,
    legs: 0,
    forearms: 0,
    calves: 0,
  }

  applyPrimaryMuscle(intensities, muscle)

  return intensities
}

function applyPrimaryMuscle(
  intensities: Record<string, number>,
  muscle: MuscleGroup,
) {
  switch (muscle) {
    case 'chest':
      intensities.chest = 1
      break
    case 'back':
      intensities.back = 1
      break
    case 'shoulders':
      intensities.shoulders = 1
      break
    case 'biceps':
      intensities.biceps = 1
      intensities.forearms = 0.35
      break
    case 'triceps':
      intensities.triceps = 1
      intensities.forearms = 0.35
      break
    case 'legs':
      intensities.legs = 1
      intensities.calves = 0.45
      break
    case 'glutes':
      intensities.glutes = 1
      break
    case 'abs':
      intensities.abs = 1
      break
    case 'full_body':
      intensities.chest = 0.55
      intensities.back = 0.55
      intensities.shoulders = 0.45
      intensities.legs = 0.5
      intensities.abs = 0.4
      break
    case 'cardio':
      intensities.legs = 0.35
      break
    default:
      break
  }
}

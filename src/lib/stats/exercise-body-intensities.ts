import { normalizeMuscleGroup } from '@/lib/stats/muscle-groups'
import type { MuscleGroup } from '@/lib/workout/exercise-meta'

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

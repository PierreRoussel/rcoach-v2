import type { MuscleGroup } from '@/lib/workout/exercise-meta'

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Epaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Jambes',
  glutes: 'Fessiers',
  abs: 'Abdos',
  full_body: 'Corps entier',
  cardio: 'Cardio',
}

export const RADAR_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'glutes',
  'abs',
]

export function normalizeMuscleGroup(value: string | null | undefined): MuscleGroup {
  if (!value) {
    return 'full_body'
  }

  const normalized = value.toLowerCase() as MuscleGroup
  if (normalized in MUSCLE_GROUP_LABELS) {
    return normalized
  }

  return 'full_body'
}

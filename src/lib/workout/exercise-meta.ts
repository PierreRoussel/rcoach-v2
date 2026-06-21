const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'glutes',
  'abs',
  'full_body',
  'cardio',
] as const

const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'kettlebell',
  'band',
  'other',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]
export type Equipment = (typeof EQUIPMENT)[number]

export { MUSCLE_GROUPS, EQUIPMENT }

export function inferExerciseMeta(name: string): {
  muscle_group: MuscleGroup
  equipment: Equipment
} {
  const lower = name.toLowerCase()

  let equipment: Equipment = 'other'
  if (lower.includes('barbell')) equipment = 'barbell'
  else if (lower.includes('dumbbell')) equipment = 'dumbbell'
  else if (lower.includes('kettlebell')) equipment = 'kettlebell'
  else if (lower.includes('cable')) equipment = 'cable'
  else if (lower.includes('machine')) equipment = 'machine'
  else if (lower.includes('band')) equipment = 'band'
  else if (
    lower.includes('pull up') ||
    lower.includes('chin up') ||
    lower.includes('push up') ||
    lower.includes('crunch') ||
    lower.includes('warm up')
  ) {
    equipment = 'bodyweight'
  }

  let muscle_group: MuscleGroup = 'full_body'
  if (/curl|biceps|triceps|skull/i.test(lower)) muscle_group = 'biceps'
  else if (/bench|fly|chest press/i.test(lower)) muscle_group = 'chest'
  else if (/row|deadlift|pull|lat/i.test(lower)) muscle_group = 'back'
  else if (/squat|leg|lunge|calf|hip thrust|press \(machine\)/i.test(lower))
    muscle_group = 'legs'
  else if (/shoulder|lateral|overhead press/i.test(lower)) muscle_group = 'shoulders'
  else if (/crunch|abs|plank/i.test(lower)) muscle_group = 'abs'
  else if (/run|bike|rower|cardio/i.test(lower)) muscle_group = 'cardio'

  return { muscle_group, equipment }
}

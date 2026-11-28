import type { Exercise } from '@/lib/graphql/operations'
import { resolveEquipmentOptions } from '@/lib/workout/exercise-instance-key'
import type { Equipment } from '@/lib/workout/exercise-meta'
import type { ExerciseKind } from '@/lib/workout/progressive-overload'

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barre',
  dumbbell: 'Haltères',
  cable: 'Poulie',
  machine: 'Machine',
  bodyweight: 'Poids du corps',
  kettlebell: 'Kettlebell',
  band: 'Élastique',
  other: 'Autre',
}

export const TRACKING_KIND_LABELS: Record<ExerciseKind, string> = {
  weighted: 'Charge + répétitions',
  bodyweight: 'Répétitions au poids du corps',
  timed: 'Durée (isométrique)',
  loaded_timed: 'Charge + durée',
  cardio: 'Cardio',
  band: 'Élastique / résistance',
}

export function formatEquipmentLabel(equipment: string | null | undefined): string | null {
  if (!equipment?.trim()) {
    return null
  }

  const normalized = equipment.toLowerCase() as Equipment
  if (normalized in EQUIPMENT_LABELS) {
    return EQUIPMENT_LABELS[normalized]
  }

  return equipment
}

export function formatEquipmentOptionsSubtitle(
  exercise: Pick<Exercise, 'equipment' | 'equipment_options'>,
): string {
  const labels = resolveEquipmentOptions(exercise)
    .map((key) => formatEquipmentLabel(key))
    .filter((label): label is string => Boolean(label))
  return labels.join(' · ') || formatEquipmentLabel(exercise.equipment) || '—'
}

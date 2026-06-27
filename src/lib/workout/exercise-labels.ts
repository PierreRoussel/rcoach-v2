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

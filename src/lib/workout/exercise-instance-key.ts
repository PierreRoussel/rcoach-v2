import type { Equipment } from '@/lib/workout/exercise-meta'
import { formatEquipmentLabel } from '@/lib/workout/exercise-labels'

const ALLOWED_EQUIPMENT = new Set<string>([
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'kettlebell',
  'band',
  'other',
])

export function normalizeInstanceEquipment(
  value: string | null | undefined,
): Equipment {
  const raw = value?.trim().toLowerCase()
  if (raw && ALLOWED_EQUIPMENT.has(raw)) {
    return raw as Equipment
  }
  return 'other'
}

export function exerciseInstanceKey(
  exerciseId: string,
  equipment: string | null | undefined,
): string {
  return `${exerciseId}\u0000${normalizeInstanceEquipment(equipment)}`
}

export function resolveEquipmentOptions(
  exercise: Pick<
    { equipment: string | null; equipment_options?: string[] | null },
    'equipment' | 'equipment_options'
  >,
): Equipment[] {
  const fromOptions = exercise.equipment_options
    ?.map((item) => normalizeInstanceEquipment(item))
    .filter((item, index, array) => array.indexOf(item) === index)

  if (fromOptions && fromOptions.length > 0) {
    return fromOptions
  }

  return [normalizeInstanceEquipment(exercise.equipment)]
}

export function defaultLineEquipment(
  exercise: Pick<
    { equipment: string | null; equipment_options?: string[] | null },
    'equipment' | 'equipment_options'
  >,
): Equipment {
  const options = resolveEquipmentOptions(exercise)
  const catalogDefault = normalizeInstanceEquipment(exercise.equipment)
  if (options.includes(catalogDefault)) {
    return catalogDefault
  }
  return options[0] ?? 'other'
}

export function exerciseOptionsIncludeEquipment(
  exercise: Pick<
    { equipment: string | null; equipment_options?: string[] | null },
    'equipment' | 'equipment_options'
  >,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }
  return resolveEquipmentOptions(exercise).some((key) => {
    const label = formatEquipmentLabel(key)?.toLowerCase()
    return label?.includes(normalized) || key.includes(normalized)
  })
}

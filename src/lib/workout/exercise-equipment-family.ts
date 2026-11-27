import type { Exercise } from '@/lib/graphql/operations'
import { MUSCLE_GROUP_LABELS, normalizeMuscleGroup } from '@/lib/stats/muscle-groups'
import { EQUIPMENT_LABELS, formatEquipmentLabel } from '@/lib/workout/exercise-labels'
import type { Equipment } from '@/lib/workout/exercise-meta'
import { EQUIPMENT } from '@/lib/workout/exercise-meta'
import {
  exerciseNameMatchesQuery,
  resolveExerciseDisplayName,
} from '@/lib/workout/translate-exercise-name'

/** EN / FR parenthetical suffixes aligned with EQUIPMENT_LABELS. */
export const EQUIPMENT_NAME_SUFFIX: Record<Equipment, readonly string[]> = {
  barbell: ['barbell', 'barre'],
  dumbbell: ['dumbbell', 'dumbbells', 'haltères', 'halteres'],
  cable: ['cable', 'poulie'],
  machine: ['machine'],
  bodyweight: ['bodyweight', 'poids du corps'],
  kettlebell: ['kettlebell'],
  band: ['band', 'bands', 'élastique', 'elastique'],
  other: ['other', 'autre'],
}

const SUFFIX_PATTERN = new RegExp(
  `\\s*\\((?:${EQUIPMENT.flatMap((key) => EQUIPMENT_NAME_SUFFIX[key]).join('|')})\\)\\s*$`,
  'i',
)

export type FamilyGroup = {
  familyKey: string
  baseLabel: string
  muscleGroup: string | null
  variants: Exercise[]
}

export function familyGroupMetaLabel(group: FamilyGroup): string {
  const parts: string[] = []
  if (group.muscleGroup) {
    parts.push(MUSCLE_GROUP_LABELS[normalizeMuscleGroup(group.muscleGroup)])
  }
  if (group.variants.length > 1) {
    parts.push(`${group.variants.length} équipements`)
  } else {
    const equipmentLabel = formatEquipmentLabel(group.variants[0]?.equipment)
    if (equipmentLabel) {
      parts.push(equipmentLabel)
    }
  }
  return parts.join(' · ') || '—'
}

export function stripEquipmentSuffix(name: string): string {
  return name.replace(SUFFIX_PATTERN, '').trim()
}

export function exerciseFamilyKey(
  exercise: Pick<Exercise, 'name' | 'is_public'>,
): string {
  const base = stripEquipmentSuffix(exercise.name).toLowerCase().trim()
  return `${base}|${exercise.is_public ? 'pub' : 'priv'}`
}

function variantEquipmentLabel(exercise: Exercise): string {
  return (
    formatEquipmentLabel(exercise.equipment) ??
    EQUIPMENT_LABELS.other
  )
}

function sortVariants(variants: Exercise[]): Exercise[] {
  return [...variants].sort((a, b) =>
    variantEquipmentLabel(a).localeCompare(variantEquipmentLabel(b), 'fr'),
  )
}

function baseDisplayLabel(variants: Exercise[]): string {
  const primary = variants[0]!
  const display = resolveExerciseDisplayName(
    { name: primary.name, name_fr: primary.name_fr },
    'fr',
  )
  return stripEquipmentSuffix(display)
}

// ponytail: O(n) scan of filtered catalog — fine for public catalog size; upgrade = family_key column
export function groupExercisesByFamily(exercises: Exercise[]): FamilyGroup[] {
  const buckets = new Map<string, Exercise[]>()

  for (const exercise of exercises) {
    const key = exerciseFamilyKey(exercise)
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.push(exercise)
    } else {
      buckets.set(key, [exercise])
    }
  }

  const groups: FamilyGroup[] = []
  for (const [familyKey, variants] of buckets) {
    const sorted = sortVariants(variants)
    groups.push({
      familyKey,
      baseLabel: baseDisplayLabel(sorted),
      muscleGroup: sorted[0]?.muscle_group ?? null,
      variants: sorted,
    })
  }

  return groups.sort((a, b) => a.baseLabel.localeCompare(b.baseLabel, 'fr'))
}

export function siblingsForExercise(
  exercise: Pick<Exercise, 'id' | 'name' | 'is_public'>,
  catalog: Exercise[],
): Exercise[] {
  const key = exerciseFamilyKey(exercise)
  const siblings = catalog.filter((item) => exerciseFamilyKey(item) === key)
  if (siblings.length > 0) {
    return sortVariants(siblings)
  }
  return catalog.filter((item) => item.id === exercise.id)
}

export function exerciseMatchesTextQuery(exercise: Exercise, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  const equipmentFr = formatEquipmentLabel(exercise.equipment)?.toLowerCase()
  const muscleFr = exercise.muscle_group
    ? MUSCLE_GROUP_LABELS[normalizeMuscleGroup(exercise.muscle_group)].toLowerCase()
    : null
  const baseEn = stripEquipmentSuffix(exercise.name).toLowerCase()
  const baseFr = exercise.name_fr
    ? stripEquipmentSuffix(exercise.name_fr).toLowerCase()
    : null

  return (
    exerciseNameMatchesQuery(exercise, query) ||
    baseEn.includes(normalized) ||
    Boolean(baseFr?.includes(normalized)) ||
    Boolean(equipmentFr?.includes(normalized)) ||
    Boolean(muscleFr?.includes(normalized)) ||
    Boolean(exercise.muscle_group?.toLowerCase().includes(normalized)) ||
    Boolean(exercise.equipment?.toLowerCase().includes(normalized))
  )
}

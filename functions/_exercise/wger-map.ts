import { normalizeExerciseSearchName } from './wger.ts'

export type RCoachMuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'abs'
  | 'full_body'
  | 'cardio'

export type RCoachEquipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'other'

export type RCoachTrackingMode = 'auto' | 'weighted' | 'bodyweight' | 'timed' | 'cardio'

export type WgerImportSource = {
  id: number
  nameEn: string
  nameFr: string | null
  descriptionEn: string
  descriptionFr: string
  categoryName: string
  muscles: Array<{ name_en?: string; name: string }>
  musclesSecondary: Array<{ name_en?: string; name: string }>
  equipment: Array<{ name: string }>
}

export type MappedWgerExercise = {
  wger_exercise_id: number
  name: string
  muscle_group: RCoachMuscleGroup
  equipment: RCoachEquipment
  tracking_mode: RCoachTrackingMode
  description_fr: string | null
  description_en: string | null
}

const EQUIPMENT_NAME_SUFFIX: Record<RCoachEquipment, string | null> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: null,
  kettlebell: 'Kettlebell',
  band: 'Band',
  other: null,
}

const WGER_CATEGORY_TO_MUSCLE: Record<string, RCoachMuscleGroup> = {
  Abs: 'abs',
  Arms: 'biceps',
  Back: 'back',
  Calves: 'legs',
  Cardio: 'cardio',
  Chest: 'chest',
  Legs: 'legs',
  Shoulders: 'shoulders',
}

const WGER_MUSCLE_TO_GROUP: Record<string, RCoachMuscleGroup> = {
  Biceps: 'biceps',
  Triceps: 'triceps',
  Shoulders: 'shoulders',
  Lats: 'back',
  Glutes: 'glutes',
  Quads: 'legs',
  Hamstrings: 'legs',
  Calves: 'legs',
  Abs: 'abs',
  Chest: 'chest',
}

function mapWgerEquipmentName(name: string): RCoachEquipment | null {
  const normalized = name.toLowerCase()

  if (normalized.includes('barbell') || normalized.includes('sz-bar')) {
    return 'barbell'
  }
  if (normalized.includes('dumbbell')) {
    return 'dumbbell'
  }
  if (normalized.includes('kettlebell')) {
    return 'kettlebell'
  }
  if (normalized.includes('band')) {
    return 'band'
  }
  if (normalized.includes('bodyweight') || normalized.includes('pull-up bar')) {
    return 'bodyweight'
  }

  return null
}

function inferEquipmentFromName(nameEn: string): RCoachEquipment | null {
  const lower = nameEn.toLowerCase()

  if (/\b(barbell|sz-bar|ez bar)\b/.test(lower)) {
    return 'barbell'
  }
  if (/\bdumbbell\b/.test(lower)) {
    return 'dumbbell'
  }
  if (/\bkettlebell\b/.test(lower)) {
    return 'kettlebell'
  }
  if (/\b(band|resistance)\b/.test(lower)) {
    return 'band'
  }
  if (/\b(cable|pulldown|pushdown|face pull)\b/.test(lower)) {
    return 'cable'
  }
  if (
    /\b(machine|leg press|hack squat|pec deck|smith|lat pulldown|seated row)\b/.test(
      lower,
    )
  ) {
    return 'machine'
  }
  if (/\b(pull up|pull-up|chin up|chin-up|push up|push-up|dip|plank|crunch)\b/.test(lower)) {
    return 'bodyweight'
  }

  return null
}

export function mapWgerMuscleGroup(source: WgerImportSource): RCoachMuscleGroup {
  for (const muscle of [...source.muscles, ...source.musclesSecondary]) {
    const key = muscle.name_en?.trim() || muscle.name.trim()
    const mapped = WGER_MUSCLE_TO_GROUP[key]
    if (mapped) {
      return mapped
    }
  }

  const fromCategory = WGER_CATEGORY_TO_MUSCLE[source.categoryName]
  if (fromCategory) {
    if (fromCategory === 'biceps' && /triceps|pushdown|skull|extension/i.test(source.nameEn)) {
      return 'triceps'
    }
    return fromCategory
  }

  return 'full_body'
}

export function mapWgerEquipment(source: WgerImportSource): RCoachEquipment {
  for (const entry of source.equipment) {
    const mapped = mapWgerEquipmentName(entry.name)
    if (mapped) {
      return mapped
    }
  }

  const fromName = inferEquipmentFromName(source.nameEn)
  if (fromName) {
    return fromName
  }

  if (source.categoryName === 'Cardio') {
    return 'other'
  }

  return 'other'
}

export function inferWgerTrackingMode(
  source: WgerImportSource,
  equipment: RCoachEquipment,
): RCoachTrackingMode {
  if (source.categoryName === 'Cardio') {
    return 'cardio'
  }

  const lower = source.nameEn.toLowerCase()
  if (/\b(plank|hold|wall sit|isometric)\b/.test(lower)) {
    return 'timed'
  }

  if (equipment === 'bodyweight') {
    return 'bodyweight'
  }

  return 'auto'
}

export function buildCanonicalExerciseName(
  englishName: string,
  equipment: RCoachEquipment,
): string {
  const trimmed = englishName.trim()
  const lower = trimmed.toLowerCase()
  const suffix = EQUIPMENT_NAME_SUFFIX[equipment]

  if (!suffix) {
    return trimmed
  }

  if (lower.includes(`(${suffix.toLowerCase()})`)) {
    return trimmed
  }

  if (suffix === 'Barbell' && /\b(barbell|sz-bar|ez bar)\b/i.test(trimmed)) {
    return trimmed
  }
  if (suffix === 'Dumbbell' && /\bdumbbell\b/i.test(trimmed)) {
    return trimmed
  }
  if (suffix === 'Kettlebell' && /\bkettlebell\b/i.test(trimmed)) {
    return trimmed
  }
  if (suffix === 'Cable' && /\bcable\b/i.test(trimmed)) {
    return trimmed
  }
  if (suffix === 'Machine' && /\bmachine\b/i.test(trimmed)) {
    return trimmed
  }
  if (suffix === 'Band' && /\bband\b/i.test(trimmed)) {
    return trimmed
  }

  return `${trimmed} (${suffix})`
}

export function normalizeCatalogName(name: string): string {
  return normalizeExerciseSearchName(name)
}

export function mapWgerExercise(source: WgerImportSource): MappedWgerExercise {
  const equipment = mapWgerEquipment(source)
  const muscle_group = mapWgerMuscleGroup(source)
  const tracking_mode = inferWgerTrackingMode(source, equipment)

  return {
    wger_exercise_id: source.id,
    name: buildCanonicalExerciseName(source.nameEn, equipment),
    muscle_group,
    equipment,
    tracking_mode,
    description_fr: source.descriptionFr || source.descriptionEn || null,
    description_en: source.descriptionEn || null,
  }
}

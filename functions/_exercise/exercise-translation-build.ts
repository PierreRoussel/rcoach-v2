/** null en base = anglicisme conservé en UI FR (name affiché tel quel). */

const ENGLISH_EQUIPMENT_SUFFIXES = [
  'Barbell',
  'Dumbbell',
  'Cable',
  'Machine',
  'Kettlebell',
  'Band',
] as const

export type EnglishEquipmentSuffix = (typeof ENGLISH_EQUIPMENT_SUFFIXES)[number]

const ENGLISH_TO_FRENCH_SUFFIX: Record<EnglishEquipmentSuffix, string> = {
  Barbell: 'Barre',
  Dumbbell: 'Haltères',
  Cable: 'Poulie',
  Machine: 'Machine',
  Kettlebell: 'Kettlebell',
  Band: 'Bande',
}

export const EXERCISE_ANGLICISM_CANONICAL_NAMES = new Set([
  'Face Pull (Cable)',
  'Leg Curl (Machine)',
  'Leg Extension (Machine)',
  'Hip Thrust (Barbell)',
  'Goblet Squat (Dumbbell)',
  'Farmer Walk (Dumbbell)',
  'Kettlebell Swing',
  'Box Jump',
  'Hack Squat (Machine)',
  'Pec Deck (Machine)',
  'Deadlift High Pull',
  'Floor Press (Barbell)',
  'Floor Press (Dumbbell)',
  'Kettlebell Around the World',
  'Kettlebell Goblet Squat',
  'Kettlebell Halo',
  'Kettlebell High Pull',
  'Russian Twist (Weighted)',
  'Thruster (Kettlebell)',
])

const ANGLICISM_PATTERNS = [
  /\bface pull\b/i,
  /\bhip thrust\b/i,
  /\bgoblet squat\b/i,
  /\bthruster\b/i,
  /\bfarmer walk\b/i,
  /\bkettlebell swing\b/i,
  /\bhack squat\b/i,
  /\bpec deck\b/i,
  /\bleg curl\b/i,
  /\bleg extension\b/i,
  /\bfloor press\b/i,
  /\brussian twist\b/i,
  /\bbox jump\b/i,
  /\bdeadlift high pull\b/i,
  /\bkettlebell around the world\b/i,
  /\bkettlebell halo\b/i,
  /\bkettlebell high pull\b/i,
]

export function extractEnglishEquipmentSuffix(
  canonicalName: string,
): EnglishEquipmentSuffix | null {
  for (const suffix of ENGLISH_EQUIPMENT_SUFFIXES) {
    const pattern = new RegExp(`\\(${suffix}\\)$`)
    if (pattern.test(canonicalName.trim())) {
      return suffix
    }
  }

  return null
}

export function isExerciseAnglicism(canonicalName: string): boolean {
  if (EXERCISE_ANGLICISM_CANONICAL_NAMES.has(canonicalName)) {
    return true
  }

  return ANGLICISM_PATTERNS.some((pattern) => pattern.test(canonicalName))
}

function stripTrailingParenthetical(value: string): string {
  return value.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

export function resolveExerciseNameFr(input: {
  name: string
  wgerNameFr?: string | null
}): string | null {
  return buildFrenchExerciseTranslation({
    canonicalName: input.name,
    wgerNameFr: input.wgerNameFr,
  })
}

export function buildFrenchExerciseTranslation(input: {
  canonicalName: string
  wgerNameFr: string | null | undefined
}): string | null {
  if (isExerciseAnglicism(input.canonicalName)) {
    return null
  }

  const frenchName = input.wgerNameFr?.trim()
  if (!frenchName) {
    return null
  }

  const equipmentSuffix = extractEnglishEquipmentSuffix(input.canonicalName)
  const base = stripTrailingParenthetical(frenchName)

  if (!base) {
    return null
  }

  if (equipmentSuffix) {
    return `${base} (${ENGLISH_TO_FRENCH_SUFFIX[equipmentSuffix]})`
  }

  return base
}

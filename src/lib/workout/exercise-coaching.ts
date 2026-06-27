export type ExerciseContentStatus = 'pending' | 'ready' | 'partial' | 'failed'

export type ExerciseContentSource = 'seed' | 'wger' | 'manual' | 'catalog'

export type ExerciseCoachingCues = {
  summary?: string
  setup?: string
  execution?: string
  cues?: string[]
  mistakes?: string[]
}

export function parseExerciseCoachingCues(
  value: unknown,
): ExerciseCoachingCues | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const cues = Array.isArray(record.cues)
    ? record.cues.filter((entry): entry is string => typeof entry === 'string')
    : undefined
  const mistakes = Array.isArray(record.mistakes)
    ? record.mistakes.filter((entry): entry is string => typeof entry === 'string')
    : undefined

  const parsed: ExerciseCoachingCues = {
    summary: typeof record.summary === 'string' ? record.summary : undefined,
    setup: typeof record.setup === 'string' ? record.setup : undefined,
    execution: typeof record.execution === 'string' ? record.execution : undefined,
    cues: cues?.length ? cues : undefined,
    mistakes: mistakes?.length ? mistakes : undefined,
  }

  if (
    !parsed.summary &&
    !parsed.setup &&
    !parsed.execution &&
    !parsed.cues &&
    !parsed.mistakes
  ) {
    return null
  }

  return parsed
}

export function hasCoachingContent(
  cues: ExerciseCoachingCues | null,
  descriptionFr: string | null | undefined,
): boolean {
  if (descriptionFr?.trim()) {
    return true
  }

  if (!cues) {
    return false
  }

  return Boolean(
    cues.summary?.trim() ||
      cues.setup?.trim() ||
      cues.execution?.trim() ||
      cues.cues?.length ||
      cues.mistakes?.length,
  )
}

export function resolveExerciseCoaching(
  coachingCues: unknown,
  descriptionFr: string | null | undefined,
  fallback: ExerciseCoachingCues,
): ExerciseCoachingCues {
  const parsed = parseExerciseCoachingCues(coachingCues)
  if (parsed && hasCoachingContent(parsed, null)) {
    return parsed
  }

  if (descriptionFr?.trim()) {
    return { ...fallback, summary: descriptionFr.trim() }
  }

  return fallback
}

const MUSCLE_LABELS_FR: Record<string, string> = {
  chest: 'pectoraux',
  back: 'dos',
  shoulders: 'épaules',
  biceps: 'biceps',
  triceps: 'triceps',
  legs: 'jambes',
  glutes: 'fessiers',
  abs: 'abdominaux',
  full_body: 'corps entier',
  cardio: 'cardio',
}

const EQUIPMENT_LABELS_FR: Record<string, string> = {
  barbell: 'barre',
  dumbbell: 'haltères',
  cable: 'poulie',
  machine: 'machine',
  bodyweight: 'poids du corps',
  kettlebell: 'kettlebell',
  band: 'élastique',
  other: 'équipement libre',
}

const TRACKING_HINTS: Record<string, string> = {
  weighted: 'Charge les séries de travail de façon progressive en gardant une exécution propre.',
  bodyweight:
    'Priorise l’amplitude et la qualité du mouvement avant d’ajouter des répétitions.',
  timed: 'Maintiens une tension constante sur toute la durée visée, sans relâcher la posture.',
  cardio: 'Garde un rythme soutenable et une respiration régulière du début à la fin.',
}

export function buildTemplateCoachingCues(input: {
  muscleGroup: string | null | undefined
  equipment: string | null | undefined
  trackingMode?: string | null
}): ExerciseCoachingCues {
  const muscle =
    MUSCLE_LABELS_FR[input.muscleGroup ?? 'full_body'] ?? 'corps entier'
  const equipment =
    EQUIPMENT_LABELS_FR[input.equipment ?? 'other'] ?? 'équipement libre'
  const trackingHint =
    TRACKING_HINTS[input.trackingMode ?? 'auto'] ??
    TRACKING_HINTS.weighted

  return {
    summary: `Exercice ciblant les ${muscle} à la ${equipment}. Adoptez une posture stable et contrôlez chaque répétition.`,
    setup: `Installez-vous confortablement avec le ${equipment}, gainage activé et articulations alignées avant de commencer.`,
    execution: `${trackingHint} Expirez sur la phase d’effort et gardez une amplitude complète sans compenser.`,
    cues: [
      'Gainage serré du début à la fin',
      'Mouvement contrôlé, sans à-coups',
      'Amplitude complète sur chaque répétition',
    ],
    mistakes: [
      'Sacrifier la technique pour ajouter charge ou reps',
      'Relâcher le gainage en fin de série',
    ],
  }
}

export function coachingCuesFromWgerDescription(description: string): ExerciseCoachingCues {
  const trimmed = description.trim()
  if (!trimmed) {
    return {}
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (paragraphs.length === 1) {
    return { summary: paragraphs[0] }
  }

  return {
    summary: paragraphs[0],
    setup: paragraphs[1],
    execution: paragraphs.slice(2).join(' '),
  }
}

export function normalizeExerciseSearchName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

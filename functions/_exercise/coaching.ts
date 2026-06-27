type CoachingCues = {
  summary?: string
  setup?: string
  execution?: string
  cues?: string[]
  mistakes?: string[]
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
}): CoachingCues {
  const muscle =
    MUSCLE_LABELS_FR[input.muscleGroup ?? 'full_body'] ?? 'corps entier'
  const equipment =
    EQUIPMENT_LABELS_FR[input.equipment ?? 'other'] ?? 'équipement libre'
  const trackingHint =
    TRACKING_HINTS[input.trackingMode ?? 'auto'] ?? TRACKING_HINTS.weighted

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

export type { CoachingCues }

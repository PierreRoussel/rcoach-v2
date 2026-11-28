import type { Exercise } from '@/lib/graphql/operations'
import type { ActiveExerciseDraft } from '@/lib/db/dexie'
import type { TemplateExerciseDraft } from '@/hooks/useWorkoutTemplates'
import { defaultLineEquipment } from '@/lib/workout/exercise-instance-key'
import { stripEquipmentSuffix } from '@/lib/workout/exercise-equipment-family'

export type ExerciseMergeMap = ReadonlyMap<string, string>

export function buildExerciseMergeMap(
  rows: Array<{ old_id: string; new_id: string }>,
): ExerciseMergeMap {
  return new Map(rows.map((row) => [row.old_id, row.new_id]))
}

function remapExerciseRef(
  exerciseId: string,
  catalogById: Map<string, Exercise>,
  mergeMap: ExerciseMergeMap,
): { exerciseId: string; exercise: Exercise | null } {
  const mappedId = mergeMap.get(exerciseId) ?? exerciseId
  const exercise = catalogById.get(mappedId) ?? catalogById.get(exerciseId) ?? null
  return { exerciseId: mappedId, exercise }
}

export function remapActiveExerciseDraft(
  draft: ActiveExerciseDraft,
  catalogById: Map<string, Exercise>,
  mergeMap: ExerciseMergeMap,
): ActiveExerciseDraft {
  const { exerciseId, exercise } = remapExerciseRef(
    draft.exerciseId,
    catalogById,
    mergeMap,
  )
  if (!exercise) {
    return { ...draft, exerciseId }
  }

  const equipment =
    draft.equipment ??
    defaultLineEquipment(exercise)

  return {
    ...draft,
    exerciseId,
    exerciseName: exercise.name,
    exerciseNameFr: exercise.name_fr ?? null,
    muscleGroup: exercise.muscle_group,
    equipment,
    trackingMode: exercise.tracking_mode ?? draft.trackingMode ?? null,
  }
}

export function remapTemplateExerciseDraft(
  draft: TemplateExerciseDraft,
  catalogById: Map<string, Exercise>,
  mergeMap: ExerciseMergeMap,
): TemplateExerciseDraft {
  const { exerciseId, exercise } = remapExerciseRef(
    draft.exerciseId,
    catalogById,
    mergeMap,
  )
  if (!exercise) {
    return { ...draft, exerciseId }
  }

  const equipment = draft.equipment ?? defaultLineEquipment(exercise)

  return {
    ...draft,
    exerciseId,
    exerciseName: exercise.name,
    exerciseNameFr: exercise.name_fr ?? null,
    muscleGroup: exercise.muscle_group,
    equipment,
    trackingMode: exercise.tracking_mode ?? draft.trackingMode ?? null,
  }
}

export function inferEquipmentFromLegacyName(name: string): string | null {
  const match = name.match(/\(([^)]+)\)\s*$/i)
  if (!match?.[1]) {
    return null
  }
  const token = match[1].toLowerCase()
  if (token.includes('barbell') || token.includes('barre')) return 'barbell'
  if (token.includes('dumbbell') || token.includes('halt')) return 'dumbbell'
  if (token.includes('cable') || token.includes('poulie')) return 'cable'
  if (token.includes('machine')) return 'machine'
  if (token.includes('body') || token.includes('poids')) return 'bodyweight'
  if (token.includes('kettle')) return 'kettlebell'
  if (token.includes('band') || token.includes('élast') || token.includes('elast'))
    return 'band'
  return 'other'
}

export function resolveHevyExerciseMatch(
  title: string,
  catalog: Exercise[],
): { exercise: Exercise; equipment: string } | null {
  const normalized = stripEquipmentSuffix(title).toLowerCase().trim()
  const inferred = inferEquipmentFromLegacyName(title)

  const candidates = catalog.filter((item) => {
    const baseEn = stripEquipmentSuffix(item.name).toLowerCase().trim()
    const baseFr = item.name_fr
      ? stripEquipmentSuffix(item.name_fr).toLowerCase().trim()
      : null
  return baseEn === normalized || baseFr === normalized || item.name.toLowerCase() === title.toLowerCase()
  })

  if (candidates.length === 0) {
    return null
  }

  const equipment = inferred ?? defaultLineEquipment(candidates[0]!)
  const exact = candidates.find(
    (item) => defaultLineEquipment(item) === equipment || item.equipment === equipment,
  )
  const exercise = exact ?? candidates[0]!
  return { exercise, equipment: normalizeEquipmentChoice(exercise, equipment) }
}

function normalizeEquipmentChoice(exercise: Exercise, equipment: string): string {
  const options = exercise.equipment_options ?? []
  if (options.includes(equipment)) {
    return equipment
  }
  return defaultLineEquipment(exercise)
}
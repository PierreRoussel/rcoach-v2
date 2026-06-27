import type { TemplateExerciseDraft } from '@/hooks/useWorkoutTemplates'
import type { ActiveExerciseEntry } from '@/lib/workout/active-store'

export type TemplateExerciseLineSnapshot = {
  exerciseId: string
  exerciseName: string
  exerciseNameFr?: string | null
}

export type TemplateLineupComparisonRow = {
  before: TemplateExerciseLineSnapshot | null
  after: TemplateExerciseLineSnapshot | null
}

type ExerciseLineupSource = Pick<
  ActiveExerciseEntry,
  'exerciseId' | 'exerciseName' | 'exerciseNameFr'
>

export function snapshotExerciseLineup(
  exercises: ExerciseLineupSource[],
): TemplateExerciseLineSnapshot[] {
  return exercises.map((exercise) => ({
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.exerciseName,
    exerciseNameFr: exercise.exerciseNameFr ?? null,
  }))
}

export function snapshotFromTemplateDrafts(
  exercises: TemplateExerciseDraft[],
): TemplateExerciseLineSnapshot[] {
  return snapshotExerciseLineup(exercises)
}

export function templateLineupChanged(
  before: TemplateExerciseLineSnapshot[],
  after: TemplateExerciseLineSnapshot[],
): boolean {
  if (before.length !== after.length) {
    return true
  }

  return before.some(
    (exercise, index) => exercise.exerciseId !== after[index]?.exerciseId,
  )
}

export function buildTemplateLineupComparison(
  before: TemplateExerciseLineSnapshot[],
  after: TemplateExerciseLineSnapshot[],
): TemplateLineupComparisonRow[] {
  const rowCount = Math.max(before.length, after.length)

  return Array.from({ length: rowCount }, (_, index) => ({
    before: before[index] ?? null,
    after: after[index] ?? null,
  }))
}

export function isTemplateLineupComparisonRowChanged(
  row: TemplateLineupComparisonRow,
): boolean {
  if (!row.before || !row.after) {
    return true
  }

  return row.before.exerciseId !== row.after.exerciseId
}

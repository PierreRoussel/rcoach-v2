import { MUSCLE_GROUP_LABELS, normalizeMuscleGroup } from '@/lib/stats/muscle-groups'
import type { ActiveSet } from '@/lib/workout/active-store'
import { formatEquipmentLabel } from '@/lib/workout/exercise-labels'
import { getExerciseTrackingKind } from '@/lib/workout/exercise-tracking'

type ExerciseSummarySource = {
  exerciseName: string
  equipment?: string | null
  muscleGroup?: string | null
}

function completedWorkingSets(sets: ActiveSet[]): ActiveSet[] {
  return sets.filter(
    (set) => Boolean(set.completedAt) && set.setType !== 'warmup',
  )
}

export function formatExerciseSubtitle(
  muscleGroup: string | null | undefined,
  equipment: string | null | undefined,
): string | null {
  const parts: string[] = []

  if (muscleGroup) {
    parts.push(MUSCLE_GROUP_LABELS[normalizeMuscleGroup(muscleGroup)])
  }

  const equipmentLabel = formatEquipmentLabel(equipment)
  if (equipmentLabel) {
    parts.push(equipmentLabel)
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

export function formatActiveExerciseCollapsedSummary(
  sets: ActiveSet[],
  exercise: ExerciseSummarySource,
): string | null {
  const completed = completedWorkingSets(sets)
  if (completed.length === 0) {
    return null
  }

  const trackingKind = getExerciseTrackingKind({
    name: exercise.exerciseName,
    equipment: exercise.equipment ?? null,
  })

  if (trackingKind === 'timed') {
    const durations = completed
      .map((set) => set.durationSeconds)
      .filter((duration): duration is number => duration != null && duration > 0)

    if (durations.length === 0) {
      return null
    }

    if (durations.every((duration) => duration === durations[0])) {
      return `${durations.length} × ${durations[0]}s`
    }

    return durations.map((duration) => `${duration}s`).join(', ')
  }

  const reps = completed
    .map((set) => set.reps)
    .filter((rep): rep is number => rep != null && rep > 0)

  if (reps.length === 0) {
    return null
  }

  const weights = completed.map((set) => set.weightKg)
  const hasUniformWeight =
    weights.length === completed.length &&
    weights.every(
      (weight) => weight != null && weight > 0 && weight === weights[0],
    )

  if (reps.every((rep) => rep === reps[0])) {
    const count = reps.length
    const repValue = reps[0]

    if (hasUniformWeight && weights[0] != null && weights[0] > 0) {
      return `${count} × ${repValue} @ ${weights[0]}kg`
    }

    return `${count} × ${repValue}`
  }

  return reps.join(', ')
}

export function isExerciseComplete(sets: ActiveSet[]): boolean {
  return sets.length > 0 && sets.every((set) => Boolean(set.completedAt))
}

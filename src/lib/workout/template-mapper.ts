import type { ActiveExerciseEntry } from '@/lib/workout/active-store'
import type { TemplateExerciseDraft } from '@/hooks/useWorkoutTemplates'
import { normalizeSessionMode, type SessionMode } from '@/lib/workout/session-mode'

export function templateExercisesToActive(
  exercises: TemplateExerciseDraft[],
  sessionMode: SessionMode = 'circuit',
): ActiveExerciseEntry[] {
  const isEmom = sessionMode === 'emom'

  return exercises.map((exercise) => ({
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.exerciseName,
    exerciseNameFr: exercise.exerciseNameFr ?? null,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    supersetId: isEmom ? null : exercise.supersetId,
    emomGroupId: isEmom ? exercise.emomGroupId ?? null : null,
    targetReps: isEmom ? exercise.targetReps ?? null : null,
    targetWeightKg: isEmom ? exercise.targetWeightKg ?? null : null,
    defaultRestSeconds: exercise.defaultRestSeconds,
    sets: isEmom
      ? []
      : exercise.sets.map((set, index) => ({
          setIndex: index,
          setType: set.setType ?? 'normal',
          weightKg: set.weightKg,
          reps: set.reps,
          durationSeconds: set.durationSeconds ?? null,
          restSeconds: set.usesGlobalRest
            ? exercise.defaultRestSeconds
            : set.restSeconds,
          completedAt: null,
        })),
  }))
}

export function resolveTemplateSessionMode(template: {
  session_mode?: string | null
}): SessionMode {
  return normalizeSessionMode(template.session_mode)
}

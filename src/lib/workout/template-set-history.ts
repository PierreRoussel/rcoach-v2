import { formatSetPerformanceSummary } from '@/lib/workout/format-set-performance'

export type HistoricalSet = {
  set_index: number
  weight_kg: number | null
  reps: number | null
  rpe?: number | null
  duration_seconds?: number | null
  distance_km?: number | null
  set_type?: string | null
}

export type HistoricalWorkoutExercise = {
  exercise_id: string
  sets: HistoricalSet[]
}

export type HistoricalWorkout = {
  workout_template_id?: string | null
  started_at: string
  workout_exercises: HistoricalWorkoutExercise[]
}

export type TemplateSetHistory = Map<string, Map<number, string>>

export function workoutExerciseIds(workout: HistoricalWorkout): string[] {
  return workout.workout_exercises.map((entry) => entry.exercise_id)
}

export function workoutMatchesTemplate(
  workout: HistoricalWorkout,
  templateExerciseIds: string[],
): boolean {
  if (workout.workout_template_id) {
    return false
  }

  const workoutIds = workoutExerciseIds(workout)
  if (workoutIds.length !== templateExerciseIds.length) {
    return false
  }

  return workoutIds.every((id, index) => id === templateExerciseIds[index])
}

export function pickLastMatchingWorkout(
  workouts: HistoricalWorkout[],
  templateId: string,
  templateExerciseIds: string[],
): HistoricalWorkout | null {
  for (const workout of workouts) {
    if (workout.workout_template_id === templateId) {
      return workout
    }
  }

  for (const workout of workouts) {
    if (workoutMatchesTemplate(workout, templateExerciseIds)) {
      return workout
    }
  }

  return null
}

export function buildTemplateSetHistory(
  workout: HistoricalWorkout | null,
  options?: { includeRpe?: boolean },
): TemplateSetHistory {
  const history: TemplateSetHistory = new Map()

  if (!workout) {
    return history
  }

  for (const exercise of workout.workout_exercises) {
    const setsByIndex = new Map<number, string>()

    for (const set of exercise.sets) {
      const summary = formatSetPerformanceSummary(set, options)
      if (summary) {
        setsByIndex.set(set.set_index, summary)
      }
    }

    if (setsByIndex.size > 0) {
      history.set(exercise.exercise_id, setsByIndex)
    }
  }

  return history
}

export function buildExerciseSetHistoryFromWorkouts(
  exerciseIds: string[],
  workouts: Array<{
    started_at: string
    workout_exercises: Array<{
      exercise: { id: string }
      sets: HistoricalSet[]
    }>
  }>,
  options?: { includeRpe?: boolean },
): TemplateSetHistory {
  const history: TemplateSetHistory = new Map()
  const pending = new Set(exerciseIds)

  if (pending.size === 0) {
    return history
  }

  const sortedWorkouts = [...workouts].sort(
    (left, right) =>
      new Date(right.started_at).getTime() - new Date(left.started_at).getTime(),
  )

  for (const workout of sortedWorkouts) {
    for (const entry of workout.workout_exercises) {
      const exerciseId = entry.exercise.id
      if (!pending.has(exerciseId)) {
        continue
      }

      const setsByIndex = new Map<number, string>()
      for (const set of entry.sets) {
        const summary = formatSetPerformanceSummary(set, options)
        if (summary) {
          setsByIndex.set(set.set_index, summary)
        }
      }

      if (setsByIndex.size > 0) {
        history.set(exerciseId, setsByIndex)
        pending.delete(exerciseId)
      }
    }

    if (pending.size === 0) {
      break
    }
  }

  return history
}

export function getLastSetSummary(
  history: TemplateSetHistory,
  exerciseId: string,
  setIndex: number,
): string | null {
  return history.get(exerciseId)?.get(setIndex) ?? null
}

import { useMemo } from 'react'

import { useMyWorkouts } from '@/hooks/useWorkouts'
import type { Exercise } from '@/lib/graphql/operations'

export function useRecentExercises(limit = 20, options?: { enabled?: boolean }) {
  const query = useMyWorkouts({ enabled: options?.enabled ?? true })

  const data = useMemo(() => {
    const seen = new Set<string>()
    const exercises: Exercise[] = []

    const workouts = [...(query.data ?? [])].sort(
      (left, right) =>
        new Date(right.started_at).getTime() - new Date(left.started_at).getTime(),
    )

    for (const workout of workouts) {
      for (const entry of workout.workout_exercises) {
        const exercise = entry.exercise
        if (!exercise) {
          continue
        }

        if (seen.has(exercise.id)) {
          continue
        }

        seen.add(exercise.id)
        exercises.push({
          id: exercise.id,
          name: exercise.name,
          name_fr: exercise.name_fr ?? null,
          muscle_group: exercise.muscle_group,
          equipment: exercise.equipment,
          is_public: true,
        })

        if (exercises.length >= limit) {
          return exercises
        }
      }
    }

    return exercises
  }, [query.data, limit])

  return {
    ...query,
    data,
  }
}

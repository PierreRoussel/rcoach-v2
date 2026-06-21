import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  LIST_MY_WORKOUTS,
  type WorkoutSummary,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useMyWorkouts() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['workouts', 'mine'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await graphqlRequest<{ workouts: WorkoutSummary[] }>(
        nhost,
        LIST_MY_WORKOUTS,
      )

      return data.workouts
    },
  })
}

export type WeeklyVolumePoint = {
  week: string
  volume: number
  sessions: number
}

function getWeekKey(date: string) {
  const value = new Date(date)
  const day = value.getUTCDay() || 7
  value.setUTCDate(value.getUTCDate() - day + 1)
  return value.toISOString().slice(0, 10)
}

export function useWorkoutStats(workouts: WorkoutSummary[] | undefined) {
  return useMemo(() => {
    const weekly = new Map<string, WeeklyVolumePoint>()

    for (const workout of workouts ?? []) {
      const week = getWeekKey(workout.started_at)
      const current = weekly.get(week) ?? { week, volume: 0, sessions: 0 }

      for (const exercise of workout.workout_exercises) {
        for (const set of exercise.sets) {
          if (set.weight_kg != null && set.reps != null) {
            current.volume += set.weight_kg * set.reps
          }
        }
      }

      current.sessions += 1
      weekly.set(week, current)
    }

    return [...weekly.values()].sort((left, right) =>
      left.week.localeCompare(right.week),
    )
  }, [workouts])
}

export function countWorkoutSets(workout: WorkoutSummary) {
  return workout.workout_exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  )
}

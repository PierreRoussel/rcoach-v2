import { useMemo } from 'react'

import {
  buildClientActivityRows,
  buildCoachDashboardStats,
  countPendingInvites,
} from '@/lib/coach/client-dashboard'
import { useClientWorkouts, useCoachClients } from '@/hooks/useCoach'

const DASHBOARD_WORKOUT_LIMIT = 50
const RECENT_SESSIONS_LIMIT = 8

export function useCoachDashboard() {
  const {
    data: clients = [],
    isLoading: clientsLoading,
    error: clientsError,
  } = useCoachClients()
  const {
    data: workouts = [],
    isLoading: workoutsLoading,
    error: workoutsError,
  } = useClientWorkouts(DASHBOARD_WORKOUT_LIMIT)

  const stats = useMemo(
    () => buildCoachDashboardStats(clients, workouts),
    [clients, workouts],
  )

  const clientRows = useMemo(
    () =>
      buildClientActivityRows(clients, workouts).sort((left, right) => {
        if (left.isInactive !== right.isInactive) {
          return left.isInactive ? 1 : -1
        }

        const leftTime = left.lastWorkoutAt
          ? new Date(left.lastWorkoutAt).getTime()
          : 0
        const rightTime = right.lastWorkoutAt
          ? new Date(right.lastWorkoutAt).getTime()
          : 0

        return rightTime - leftTime
      }),
    [clients, workouts],
  )

  const recentWorkouts = useMemo(
    () => workouts.slice(0, RECENT_SESSIONS_LIMIT),
    [workouts],
  )

  const pendingCount = useMemo(() => countPendingInvites(clients), [clients])

  return {
    stats,
    clientRows,
    recentWorkouts,
    pendingCount,
    isLoading: clientsLoading || workoutsLoading,
    error: clientsError ?? workoutsError ?? null,
  }
}

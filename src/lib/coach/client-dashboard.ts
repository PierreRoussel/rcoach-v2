import { differenceInCalendarDays, subDays } from 'date-fns'

import type { ClientWorkout, CoachClient } from '@/lib/graphql/operations'

export const INACTIVITY_DAYS = 7
export const DASHBOARD_LOOKBACK_DAYS = 7

export type ClientActivityRow = {
  clientId: string
  label: string
  email: string | null
  lastWorkoutAt: string | null
  sessionsLast7Days: number
  volumeLast7Days: number
  isInactive: boolean
}

export type CoachDashboardStats = {
  activeClients: number
  pendingInvites: number
  sessionsLast7Days: number
  volumeLast7Days: number
}

function computeWorkoutVolume(workout: ClientWorkout) {
  let volume = 0

  for (const exercise of workout.workout_exercises) {
    for (const set of exercise.sets) {
      if (set.set_type === 'warmup') continue
      if (set.weight_kg != null && set.reps != null) {
        volume += set.weight_kg * set.reps
      }
    }
  }

  return volume
}

export function getClientLabel(client: CoachClient) {
  const name = client.athlete?.display_name?.trim()
  if (name) {
    return name
  }

  const email = client.invited_email?.trim()
  if (email) {
    return email
  }

  return 'Client'
}

export function countPendingInvites(clients: CoachClient[]) {
  return clients.filter((client) => client.status === 'pending').length
}

export function countActiveClients(clients: CoachClient[]) {
  return clients.filter((client) => client.status === 'active').length
}

function resolveClientUserId(client: CoachClient) {
  return client.athlete_id ?? client.athlete?.id ?? null
}

function isWithinLookback(date: string, now = new Date()) {
  const startedAt = new Date(date)
  const cutoff = subDays(now, DASHBOARD_LOOKBACK_DAYS)
  return startedAt >= cutoff
}

export function buildClientActivityRows(
  clients: CoachClient[],
  workouts: ClientWorkout[],
  now = new Date(),
): ClientActivityRow[] {
  const activeClients = clients.filter((client) => client.status === 'active')

  return activeClients.map((client) => {
    const clientUserId = resolveClientUserId(client)
    const clientWorkouts = clientUserId
      ? workouts.filter((workout) => workout.user.id === clientUserId)
      : []

    const sortedWorkouts = [...clientWorkouts].sort(
      (left, right) =>
        new Date(right.started_at).getTime() - new Date(left.started_at).getTime(),
    )

    const recentWorkouts = sortedWorkouts.filter((workout) =>
      isWithinLookback(workout.started_at, now),
    )

    const lastWorkoutAt = sortedWorkouts[0]?.started_at ?? null
    const daysSinceLastWorkout = lastWorkoutAt
      ? differenceInCalendarDays(now, new Date(lastWorkoutAt))
      : null

    return {
      clientId: client.id,
      label: getClientLabel(client),
      email: client.invited_email,
      lastWorkoutAt,
      sessionsLast7Days: recentWorkouts.length,
      volumeLast7Days: recentWorkouts.reduce(
        (sum, workout) => sum + computeWorkoutVolume(workout),
        0,
      ),
      isInactive:
        daysSinceLastWorkout == null || daysSinceLastWorkout > INACTIVITY_DAYS,
    }
  })
}

export function buildCoachDashboardStats(
  clients: CoachClient[],
  workouts: ClientWorkout[],
  now = new Date(),
): CoachDashboardStats {
  const recentWorkouts = workouts.filter((workout) =>
    isWithinLookback(workout.started_at, now),
  )

  return {
    activeClients: countActiveClients(clients),
    pendingInvites: countPendingInvites(clients),
    sessionsLast7Days: recentWorkouts.length,
    volumeLast7Days: recentWorkouts.reduce(
      (sum, workout) => sum + computeWorkoutVolume(workout),
      0,
    ),
  }
}

export function formatRelativeWorkoutDate(
  date: string | null,
  now = new Date(),
) {
  if (!date) {
    return 'Aucune seance'
  }

  const days = differenceInCalendarDays(now, new Date(date))

  if (days === 0) {
    return "Aujourd'hui"
  }

  if (days === 1) {
    return 'Hier'
  }

  if (days < 7) {
    return `Il y a ${days} j`
  }

  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

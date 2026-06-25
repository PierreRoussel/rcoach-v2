import { describe, expect, it } from 'vitest'

import {
  buildClientActivityRows,
  buildCoachDashboardStats,
  countPendingInvites,
  formatRelativeWorkoutDate,
  getClientLabel,
} from '@/lib/coach/client-dashboard'
import type { ClientWorkout, CoachClient } from '@/lib/graphql/operations'

const now = new Date('2026-06-20T12:00:00.000Z')

function makeClient(overrides: Partial<CoachClient> = {}): CoachClient {
  return {
    id: 'client-1',
    coach_id: 'coach-1',
    athlete_id: 'athlete-1',
    invited_email: 'athlete@example.com',
    status: 'active',
    created_at: '2026-06-01T00:00:00.000Z',
    athlete: { id: 'athlete-1', display_name: 'Leo' },
    ...overrides,
  }
}

function makeWorkout(overrides: Partial<ClientWorkout> = {}): ClientWorkout {
  return {
    id: 'workout-1',
    title: 'Fullbody',
    started_at: '2026-06-19T18:00:00.000Z',
    ended_at: '2026-06-19T19:00:00.000Z',
    user: { id: 'athlete-1', display_name: 'Leo' },
    workout_exercises: [
      {
        exercise: { name: 'Squat', muscle_group: 'legs' },
        sets: [
          { weight_kg: 60, reps: 8, set_type: 'normal' },
          { weight_kg: 40, reps: 10, set_type: 'warmup' },
        ],
      },
    ],
    ...overrides,
  }
}

describe('client-dashboard', () => {
  it('resolves client label from display name or email', () => {
    expect(getClientLabel(makeClient())).toBe('Leo')
    expect(
      getClientLabel(
        makeClient({
          athlete: null,
          invited_email: 'athlete@example.com',
        }),
      ),
    ).toBe('athlete@example.com')
    expect(
      getClientLabel(
        makeClient({
          athlete: null,
          invited_email: null,
        }),
      ),
    ).toBe('Client')
  })

  it('counts pending invites', () => {
    const clients = [
      makeClient({ id: '1', status: 'active' }),
      makeClient({ id: '2', status: 'pending' }),
      makeClient({ id: '3', status: 'pending' }),
    ]

    expect(countPendingInvites(clients)).toBe(2)
  })

  it('builds activity rows with inactivity flag', () => {
    const clients = [makeClient()]
    const workouts = [
      makeWorkout(),
      makeWorkout({
        id: 'workout-old',
        started_at: '2026-06-01T18:00:00.000Z',
      }),
    ]

    const rows = buildClientActivityRows(clients, workouts, now)

    expect(rows).toHaveLength(1)
    expect(rows[0]?.sessionsLast7Days).toBe(1)
    expect(rows[0]?.volumeLast7Days).toBe(480)
    expect(rows[0]?.isInactive).toBe(false)
  })

  it('marks client inactive when no recent session', () => {
    const clients = [makeClient()]
    const workouts = [
      makeWorkout({
        started_at: '2026-06-01T18:00:00.000Z',
      }),
    ]

    const rows = buildClientActivityRows(clients, workouts, now)

    expect(rows[0]?.isInactive).toBe(true)
    expect(rows[0]?.sessionsLast7Days).toBe(0)
  })

  it('aggregates dashboard stats for the last 7 days', () => {
    const clients = [
      makeClient(),
      makeClient({ id: 'client-2', status: 'pending' }),
    ]
    const workouts = [
      makeWorkout(),
      makeWorkout({
        id: 'workout-2',
        user: { id: 'athlete-2', display_name: 'Sam' },
        started_at: '2026-06-18T18:00:00.000Z',
      }),
      makeWorkout({
        id: 'workout-old',
        started_at: '2026-05-01T18:00:00.000Z',
      }),
    ]

    const stats = buildCoachDashboardStats(clients, workouts, now)

    expect(stats.activeClients).toBe(1)
    expect(stats.pendingInvites).toBe(1)
    expect(stats.sessionsLast7Days).toBe(2)
    expect(stats.volumeLast7Days).toBe(960)
  })

  it('formats relative workout dates', () => {
    expect(formatRelativeWorkoutDate(null, now)).toBe('Aucune séance')
    expect(formatRelativeWorkoutDate('2026-06-20T08:00:00.000Z', now)).toBe(
      "Aujourd'hui",
    )
    expect(formatRelativeWorkoutDate('2026-06-19T08:00:00.000Z', now)).toBe(
      'Hier',
    )
  })
})

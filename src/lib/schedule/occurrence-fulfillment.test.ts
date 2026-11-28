import { describe, expect, it } from 'vitest'

import type { ScheduleOccurrence } from '@/lib/schedule/expand-occurrences'
import {
  findFulfillingWorkout,
  occurrenceIsFulfilled,
  workoutFulfillsOccurrence,
  workoutOccurrenceKey,
} from '@/lib/schedule/occurrence-fulfillment'

const occurrenceA: ScheduleOccurrence = {
  date: '2026-06-20',
  sessionId: 'session-1',
  title: 'Fullbody A',
  workoutTemplateId: 'template-a',
  workoutTemplateName: 'Fullbody A',
  timeLocal: null,
}

const completedWorkoutB = {
  id: 'workout-b',
  title: 'Fullbody B',
  started_at: '2026-06-20T10:00:00.000Z',
  ended_at: '2026-06-20T11:00:00.000Z',
  workout_template_id: 'template-b',
}

const completedWorkoutA = {
  ...completedWorkoutB,
  id: 'workout-a',
  title: 'Fullbody A',
  workout_template_id: 'template-a',
}

const nowCatchUp = new Date('2026-06-21T12:00:00')

describe('workoutFulfillsOccurrence', () => {
  it('matches the planned template on the same day', () => {
    expect(workoutFulfillsOccurrence(completedWorkoutA, occurrenceA)).toBe(true)
  })

  it('does not match a different template on the same day', () => {
    expect(workoutFulfillsOccurrence(completedWorkoutB, occurrenceA)).toBe(false)
  })

  it('ignores workouts still in progress', () => {
    expect(
      workoutFulfillsOccurrence(
        { ...completedWorkoutA, ended_at: null },
        occurrenceA,
      ),
    ).toBe(false)
  })

  it('fulfills yesterday occurrence via catch-up on the next day', () => {
    const catchUp = {
      ...completedWorkoutA,
      started_at: '2026-06-21T10:00:00.000Z',
      ended_at: '2026-06-21T11:00:00.000Z',
    }

    expect(
      workoutFulfillsOccurrence(catchUp, occurrenceA, nowCatchUp),
    ).toBe(true)
  })

  it('does not fulfill via catch-up from J-2', () => {
    const tooLate = {
      ...completedWorkoutA,
      started_at: '2026-06-22T10:00:00.000Z',
      ended_at: '2026-06-22T11:00:00.000Z',
    }

    expect(workoutFulfillsOccurrence(tooLate, occurrenceA, nowCatchUp)).toBe(
      false,
    )
  })

  it('does not catch up with wrong template on J', () => {
    const wrongTemplate = {
      ...completedWorkoutB,
      started_at: '2026-06-21T10:00:00.000Z',
      ended_at: '2026-06-21T11:00:00.000Z',
    }

    expect(
      workoutFulfillsOccurrence(wrongTemplate, occurrenceA, nowCatchUp),
    ).toBe(false)
  })
})

describe('occurrenceIsFulfilled', () => {
  it('returns false when only another template was completed', () => {
    expect(occurrenceIsFulfilled([completedWorkoutB], occurrenceA)).toBe(false)
  })

  it('returns the matching workout', () => {
    expect(findFulfillingWorkout([completedWorkoutB, completedWorkoutA], occurrenceA)).toEqual(
      completedWorkoutA,
    )
  })

  it('consumes one workout for two same-template misses on J-1', () => {
    const occurrenceB: ScheduleOccurrence = {
      ...occurrenceA,
      sessionId: 'session-2',
    }
    const catchUp = {
      ...completedWorkoutA,
      started_at: '2026-06-21T10:00:00.000Z',
      ended_at: '2026-06-21T11:00:00.000Z',
    }
    const consumed = new Set<string>()
    const first = findFulfillingWorkout(
      [catchUp],
      occurrenceA,
      nowCatchUp,
      consumed,
    )
    expect(first).toEqual(catchUp)
    consumed.add(workoutOccurrenceKey(catchUp))
    expect(
      findFulfillingWorkout([catchUp], occurrenceB, nowCatchUp, consumed),
    ).toBeUndefined()
  })
})
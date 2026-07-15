import { describe, expect, it } from 'vitest'

import type { ScheduleOccurrence } from '@/lib/schedule/expand-occurrences'
import {
  findFulfillingWorkout,
  occurrenceIsFulfilled,
  workoutFulfillsOccurrence,
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
})

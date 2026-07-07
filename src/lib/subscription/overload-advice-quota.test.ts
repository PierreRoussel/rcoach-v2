import { describe, expect, it } from 'vitest'

import {
  markFreeOverloadAdviceUsed,
  pickDailyOverloadExerciseId,
  resolveDailyOverloadExerciseId,
} from '@/lib/subscription/overload-advice-quota'

describe('overload-advice-quota', () => {
  const userId = 'user-1'
  const date = new Date('2026-07-07T10:00:00.000Z')
  const exerciseIds = ['ex-a', 'ex-b', 'ex-c']

  it('picks a stable exercise for the day', () => {
    const first = pickDailyOverloadExerciseId(userId, '2026-07-07', exerciseIds)
    const second = pickDailyOverloadExerciseId(userId, '2026-07-07', exerciseIds)
    expect(first).toBe(second)
    expect(exerciseIds).toContain(first)
  })

  it('tracks free advice usage once per day', () => {
    const dailyExerciseId = resolveDailyOverloadExerciseId(userId, exerciseIds, date)
    expect(dailyExerciseId).toBeTruthy()

    const used = markFreeOverloadAdviceUsed(userId, dailyExerciseId!, date)
    expect(used.used).toBe(true)
    expect(used.exerciseId).toBe(dailyExerciseId)
  })
})

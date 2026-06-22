import { describe, expect, it, vi } from 'vitest'

import {
  buildWorkoutClientRecordId,
  pushWorkoutSession,
} from '@/lib/health/push-workout-session'
import * as preferences from '@/lib/health/health-connect-preferences'

describe('buildWorkoutClientRecordId', () => {
  it('combines startedAt and title into a stable id', () => {
    expect(
      buildWorkoutClientRecordId({
        title: 'Push day',
        startedAt: '2026-06-21T10:00:00.000Z',
      }),
    ).toBe('2026-06-21T10:00:00.000Z:Push day')
  })
})

describe('pushWorkoutSession', () => {
  it('skips when sync is disabled', async () => {
    vi.spyOn(preferences, 'isHealthConnectSyncEnabled').mockReturnValue(false)

    const result = await pushWorkoutSession(
      {
        title: 'Legs',
        startedAt: '2026-06-21T10:00:00.000Z',
      },
      '2026-06-21T11:00:00.000Z',
    )

    expect(result).toEqual({ pushed: false, reason: 'disabled' })
  })
})

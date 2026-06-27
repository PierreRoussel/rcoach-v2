import { describe, expect, it, vi } from 'vitest'

import {
  isOfflineLikeError,
  isUnrecoverableNutritionSyncError,
  shouldQueueNutritionMutation,
} from '@/lib/graphql/nutrition-mutation-policy'

describe('isOfflineLikeError', () => {
  it('detects fetch failures', () => {
    vi.stubGlobal('navigator', { onLine: true })
    expect(isOfflineLikeError(new TypeError('Failed to fetch'))).toBe(true)
  })

  it('detects gateway failures', () => {
    vi.stubGlobal('navigator', { onLine: true })
    expect(isOfflineLikeError(new Error('Request timeout'))).toBe(true)
  })

  it('does not treat validation errors as offline', () => {
    vi.stubGlobal('navigator', { onLine: true })
    expect(isOfflineLikeError(new Error('Not authenticated'))).toBe(false)
  })
})

describe('shouldQueueNutritionMutation', () => {
  it('queues when a local food reference still needs syncing', () => {
    vi.stubGlobal('navigator', { onLine: true })
    expect(
      shouldQueueNutritionMutation(new Error('unexpected'), {
        hasLocalFoodReference: true,
      }),
    ).toBe(true)
  })

  it('queues foreign key failures for a later sync attempt', () => {
    vi.stubGlobal('navigator', { onLine: true })
    expect(
      shouldQueueNutritionMutation(
        new Error('insert or update on table "meal_log_entries" violates foreign key constraint'),
      ),
    ).toBe(true)
  })

  it('surfaces unexpected business errors', () => {
    vi.stubGlobal('navigator', { onLine: true })
    expect(shouldQueueNutritionMutation(new Error('duplicate key value'))).toBe(false)
  })
})

describe('isUnrecoverableNutritionSyncError', () => {
  it('detects auth failures', () => {
    expect(isUnrecoverableNutritionSyncError(new Error('Not authenticated'))).toBe(true)
  })
})

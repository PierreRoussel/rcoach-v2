import { describe, expect, it } from 'vitest'

import { getSetPerformanceColumnLabels } from '@/components/workout/SetPerformanceInputs'

describe('getSetPerformanceColumnLabels', () => {
  it('labels loaded_timed as kg + durée', () => {
    expect(getSetPerformanceColumnLabels('loaded_timed')).toEqual([
      'kg',
      'durée (s)',
    ])
  })

  it('labels timed as durée only', () => {
    expect(getSetPerformanceColumnLabels('timed')).toEqual(['durée (s)'])
  })

  it('labels weighted as kg + reps', () => {
    expect(getSetPerformanceColumnLabels('weighted')).toEqual(['kg', 'reps'])
  })
})

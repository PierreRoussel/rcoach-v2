import { describe, expect, it } from 'vitest'

import {
  isExercisePickerReturnLocation,
  resolveExercisePickerReturnPathname,
} from '@/lib/workout/exercise-picker-session'

describe('exercise picker return location', () => {
  it('resolves template editor paths', () => {
    expect(
      resolveExercisePickerReturnPathname({
        to: '/app/sessions/$templateId',
        params: { templateId: 'abc-123' },
      }),
    ).toBe('/app/sessions/abc-123')
  })

  it('matches the current pathname for template returns', () => {
    expect(
      isExercisePickerReturnLocation('/app/sessions/abc-123/', {
        to: '/app/sessions/$templateId',
        params: { templateId: 'abc-123' },
      }),
    ).toBe(true)

    expect(
      isExercisePickerReturnLocation('/app/workout/add-exercise', {
        to: '/app/sessions/$templateId',
        params: { templateId: 'abc-123' },
      }),
    ).toBe(false)
  })
})

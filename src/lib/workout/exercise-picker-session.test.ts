import { describe, expect, it } from 'vitest'

import {
  addPendingExercise,
  buildExercisePickerReturnNavigationState,
  completeExercisePicker,
  getExercisePickerSession,
  isExercisePickerReturnLocation,
  markExercisePickerScrollTarget,
  openExercisePicker,
  peekExercisePickerPendingAdds,
  resolveExercisePickerReturnPathname,
  shouldDeferTemplateSessionClear,
  shouldKeepTemplateAddSessionForConsumer,
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

describe('exercise picker session', () => {
  it('clears replaceIndex when opening add mode', () => {
    openExercisePicker({
      excludeIds: [],
      mode: 'add',
      replaceIndex: 0,
      context: 'template',
      returnTo: { to: '/app/sessions/$templateId', params: { templateId: 'abc-123' } },
    })

    expect(getExercisePickerSession()?.mode).toBe('add')
    expect(getExercisePickerSession()?.replaceIndex).toBeUndefined()
    expect(peekExercisePickerPendingAdds()).toEqual([])
  })

  it('builds router navigation state for template pending adds', () => {
    openExercisePicker({
      excludeIds: [],
      mode: 'add',
      context: 'template',
      returnTo: { to: '/app/sessions/$templateId', params: { templateId: 'abc-123' } },
    })

    const exercise = {
      id: 'ex-1',
      name: 'Squat',
      muscle_group: 'Legs',
      equipment: 'Barbell',
      is_public: true,
    }

    addPendingExercise(exercise)
    markExercisePickerScrollTarget(exercise.id)

    expect(buildExercisePickerReturnNavigationState()).toEqual({
      exercisePickerAdds: [exercise],
      scrollToExerciseId: 'ex-1',
    })
  })

  it('builds scroll-only navigation state for active workout adds', () => {
    openExercisePicker({
      excludeIds: [],
      mode: 'add',
      context: 'active',
      returnTo: { to: '/app/workout/active' },
    })

    markExercisePickerScrollTarget('ex-2')

    expect(buildExercisePickerReturnNavigationState()).toEqual({
      scrollToExerciseId: 'ex-2',
    })
  })

  it('keeps template add sessions for the consumer until consumed', () => {
    openExercisePicker({
      excludeIds: [],
      mode: 'add',
      context: 'template',
      returnTo: { to: '/app/sessions/$templateId', params: { templateId: 'abc-123' } },
    })

    addPendingExercise({
      id: 'ex-2',
      name: 'Pull-up',
      muscle_group: 'Back',
      equipment: 'Bodyweight',
      is_public: true,
    })

    expect(shouldKeepTemplateAddSessionForConsumer()).toBe(true)
    expect(buildExercisePickerReturnNavigationState()).toEqual({
      exercisePickerAdds: [
        {
          id: 'ex-2',
          name: 'Pull-up',
          muscle_group: 'Back',
          equipment: 'Bodyweight',
          is_public: true,
        },
      ],
      scrollToExerciseId: 'ex-2',
    })
  })

  it('defers clearing template sessions until the editor consumes them', () => {
    openExercisePicker({
      excludeIds: [],
      mode: 'add',
      context: 'template',
      returnTo: { to: '/app/sessions/$templateId', params: { templateId: 'abc-123' } },
    })

    completeExercisePicker({
      exercise: {
        id: 'ex-2',
        name: 'Pull-up',
        muscle_group: 'Back',
        equipment: 'Bodyweight',
        is_public: true,
      },
      mode: 'add',
    })

    expect(shouldDeferTemplateSessionClear()).toBe(true)
  })
})

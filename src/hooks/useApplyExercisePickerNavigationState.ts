import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'

import type { Exercise } from '@/lib/graphql/operations'
import type { ExercisePickerNavigationState } from '@/lib/workout/exercise-picker-session'
import { scrollToWorkoutExercise } from '@/lib/workout/scroll-to-exercise'

type ApplyExercisePickerNavigationStateOptions = {
  onAdd?: (exercise: Exercise) => void
  onAdds?: (exercises: Exercise[]) => void
}

export function useApplyExercisePickerNavigationState(
  onAddOrOptions?: ((exercise: Exercise) => void) | ApplyExercisePickerNavigationStateOptions,
) {
  const location = useLocation()
  const navigate = useNavigate()
  const options =
    typeof onAddOrOptions === 'function'
      ? { onAdd: onAddOrOptions }
      : (onAddOrOptions ?? {})
  const onAddRef = useRef(options.onAdd)
  const onAddsRef = useRef(options.onAdds)
  onAddRef.current = options.onAdd
  onAddsRef.current = options.onAdds
  const appliedRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    const navState = location.state as ExercisePickerNavigationState | null | undefined
    const pendingAdds = navState?.exercisePickerAdds
    const scrollToExerciseId =
      navState?.scrollToExerciseId ?? pendingAdds?.[pendingAdds.length - 1]?.id

    if (!pendingAdds?.length && !scrollToExerciseId) {
      return
    }

    const applyKey = `${location.pathname}:${pendingAdds?.map((exercise) => exercise.id).join(',') ?? ''}:${scrollToExerciseId ?? ''}`
    if (appliedRef.current === applyKey) {
      return
    }
    appliedRef.current = applyKey

    if (pendingAdds?.length) {
      if (onAddsRef.current) {
        onAddsRef.current(pendingAdds)
      } else if (onAddRef.current) {
        for (const exercise of pendingAdds) {
          onAddRef.current(exercise)
        }
      }
    }

    void navigate({
      to: location.pathname,
      search: location.search,
      replace: true,
      state: {},
    })

    if (!scrollToExerciseId) {
      return
    }

    return scrollToWorkoutExercise(scrollToExerciseId)
  }, [location.pathname, location.search, location.state, navigate])
}

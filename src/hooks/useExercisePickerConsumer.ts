import { useLayoutEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'

import { isExerciseAddPath } from '@/hooks/useExerciseAddBackNavigation'
import {
  consumeExercisePickerOutcome,
  getExercisePickerSession,
  hasExercisePickerPendingWork,
  isExercisePickerReturnLocation,
  peekExercisePickerScrollTarget,
} from '@/lib/workout/exercise-picker-session'
import type { Exercise } from '@/lib/graphql/operations'
import { scrollToWorkoutExercise } from '@/lib/workout/scroll-to-exercise'

type UseExercisePickerConsumerOptions = {
  onAdd: (exercise: Exercise) => void | Promise<void>
  onAdds?: (exercises: Exercise[]) => void | Promise<void>
  onReplace?: (index: number, exercise: Exercise) => void | Promise<void>
}

export function useExercisePickerConsumer({
  onAdd,
  onAdds,
  onReplace,
}: UseExercisePickerConsumerOptions) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigationKey = useRouterState({
    select: (state) => state.location.state?.key ?? state.location.href,
  })
  const onAddRef = useRef(onAdd)
  const onAddsRef = useRef(onAdds)
  const onReplaceRef = useRef(onReplace)

  onAddRef.current = onAdd
  onAddsRef.current = onAdds
  onReplaceRef.current = onReplace

  useLayoutEffect(() => {
    if (isExerciseAddPath(pathname)) {
      return
    }

    if (!hasExercisePickerPendingWork() && !getExercisePickerSession()) {
      return
    }

    const session = getExercisePickerSession()
    if (!session || !isExercisePickerReturnLocation(pathname, session.returnTo)) {
      return
    }

    const scrollTarget = peekExercisePickerScrollTarget()

    const outcome = consumeExercisePickerOutcome()
    if (!outcome) {
      return
    }

    void (async () => {
      if (outcome.pendingAdds.length > 0) {
        if (onAddsRef.current) {
          await onAddsRef.current(outcome.pendingAdds)
        } else {
          for (const exercise of outcome.pendingAdds) {
            await onAddRef.current(exercise)
          }
        }

        const scrollToExerciseId =
          scrollTarget ?? outcome.pendingAdds[outcome.pendingAdds.length - 1]?.id
        if (scrollToExerciseId) {
          void scrollToWorkoutExercise(scrollToExerciseId)
        }

        return
      }

      if (!outcome.completedResult) {
        return
      }

      const { exercise, mode, replaceIndex } = outcome.completedResult

      if (mode === 'add') {
        if (onAddsRef.current) {
          await onAddsRef.current([exercise])
        } else {
          await onAddRef.current(exercise)
        }

        const scrollToExerciseId = scrollTarget ?? exercise.id
        if (scrollToExerciseId) {
          void scrollToWorkoutExercise(scrollToExerciseId)
        }

        return
      }

      if (mode === 'replace' && replaceIndex != null && onReplaceRef.current) {
        if (outcome.session.mode !== 'replace') {
          return
        }

        await onReplaceRef.current(replaceIndex, exercise)
      }
    })()
  }, [pathname, navigationKey])
}

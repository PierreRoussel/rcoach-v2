import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'

import { isExerciseAddPath } from '@/hooks/useExerciseAddBackNavigation'
import {
  consumeExercisePickerOutcome,
  getExercisePickerSession,
  hasExercisePickerPendingWork,
  isExercisePickerReturnLocation,
} from '@/lib/workout/exercise-picker-session'
import type { Exercise } from '@/lib/graphql/operations'

type UseExercisePickerConsumerOptions = {
  onAdd: (exercise: Exercise) => void | Promise<void>
  onReplace?: (index: number, exercise: Exercise) => void | Promise<void>
}

export function useExercisePickerConsumer({
  onAdd,
  onReplace,
}: UseExercisePickerConsumerOptions) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigationKey = useRouterState({
    select: (state) => state.location.state?.key ?? state.location.href,
  })
  const onAddRef = useRef(onAdd)
  const onReplaceRef = useRef(onReplace)

  onAddRef.current = onAdd
  onReplaceRef.current = onReplace

  useEffect(() => {
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

    const outcome = consumeExercisePickerOutcome()
    if (!outcome) {
      return
    }

    void (async () => {
      for (const exercise of outcome.pendingAdds) {
        await onAddRef.current(exercise)
      }

      if (outcome.pendingAdds.length > 0) {
        return
      }

      if (outcome.completedResult) {
        const { exercise, mode, replaceIndex } = outcome.completedResult
        if (mode === 'replace' && replaceIndex != null && onReplaceRef.current) {
          await onReplaceRef.current(replaceIndex, exercise)
          return
        }

        if (mode === 'add') {
          await onAddRef.current(exercise)
        }
      }
    })()
  }, [pathname, navigationKey])
}

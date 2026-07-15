import { useEffect, useRef } from 'react'
import { useLocation } from '@tanstack/react-router'

import { isExerciseAddPath } from '@/hooks/useExerciseAddBackNavigation'
import {
  consumeExercisePickerOutcome,
  getExercisePickerSession,
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
  const location = useLocation()
  const onAddRef = useRef(onAdd)
  const onReplaceRef = useRef(onReplace)

  onAddRef.current = onAdd
  onReplaceRef.current = onReplace

  useEffect(() => {
    if (isExerciseAddPath(location.pathname)) {
      return
    }

    const session = getExercisePickerSession()
    if (!session || !isExercisePickerReturnLocation(location.pathname, session.returnTo)) {
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
  }, [location.pathname])
}

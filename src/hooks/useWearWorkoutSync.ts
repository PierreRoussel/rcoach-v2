import { useEffect, useState } from 'react'

import {
  buildIdleWorkoutSnapshot,
  buildWorkoutSnapshot,
  type WatchCommand,
} from '@/lib/wear/workout-sync-protocol'
import {
  isWearBridgeSupported,
  publishWorkoutSnapshot,
  subscribeToWatchCommands,
} from '@/lib/wear/wear-bridge'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'

export function useWearWorkoutSync(enabled = true) {
  const [watchAvailable, setWatchAvailable] = useState(false)

  useEffect(() => {
    if (!enabled) {
      return
    }

    let unsubscribeCommands: (() => void) | undefined

    void (async () => {
      const available = await isWearBridgeSupported()
      setWatchAvailable(available)

      if (!available) {
        return
      }

      unsubscribeCommands = await subscribeToWatchCommands(handleWatchCommand)
      await publishCurrentSnapshot()
    })()

    const unsubscribeStore = useActiveWorkoutStore.subscribe(() => {
      void publishCurrentSnapshot()
    })

    return () => {
      unsubscribeStore()
      unsubscribeCommands?.()
    }
  }, [enabled])

  async function publishCurrentSnapshot() {
    const state = useActiveWorkoutStore.getState()
    const snapshot = state.startedAt
      ? buildWorkoutSnapshot({
          title: state.title,
          startedAt: state.startedAt,
          defaultRestSeconds: state.defaultRestSeconds,
          exercises: state.exercises,
          activeExerciseIndex: state.activeExerciseIndex,
          isResting: state.isResting,
          restSecondsLeft: state.restSecondsLeft,
        })
      : buildIdleWorkoutSnapshot()

    await publishWorkoutSnapshot(snapshot)
  }

  async function handleWatchCommand(command: WatchCommand) {
    const state = useActiveWorkoutStore.getState()

    switch (command.type) {
      case 'logSet': {
        if (!state.startedAt) {
          return
        }

        await state.addSet(command.exerciseIndex, {
          setType: command.setType,
          weightKg: command.weightKg,
          reps: command.reps,
        })
        state.startRest(state.defaultRestSeconds)
        break
      }
      case 'skipRest':
        state.skipRest()
        break
      case 'nextExercise': {
        const next = Math.min(
          state.activeExerciseIndex + 1,
          Math.max(state.exercises.length - 1, 0),
        )
        state.setActiveExerciseIndex(next)
        break
      }
      case 'prevExercise': {
        const prev = Math.max(state.activeExerciseIndex - 1, 0)
        state.setActiveExerciseIndex(prev)
        break
      }
      case 'ping':
        await publishCurrentSnapshot()
        break
    }
  }

  return { watchAvailable }
}

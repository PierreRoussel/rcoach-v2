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
import {
  buildCircuitSteps,
  getStepLabel,
  findNextPendingStepIndex,
} from '@/lib/workout/workout-circuit'
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
    const steps = buildCircuitSteps(state.exercises)
    const currentStep = steps[state.activeStepIndex] ?? null
    const nextIndex = findNextPendingStepIndex(steps, state.exercises, state.activeStepIndex + 1)
    const nextStepLabel = getStepLabel(
      state.exercises,
      nextIndex != null ? steps[nextIndex] ?? null : null,
    )

    const snapshot = state.startedAt
      ? buildWorkoutSnapshot(
          {
            title: state.title,
            startedAt: state.startedAt,
            defaultRestSeconds: state.defaultRestSeconds,
            exercises: state.exercises,
            activeStepIndex: state.activeStepIndex,
            isResting: state.isResting,
            restSecondsLeft: state.restSecondsLeft,
            restTargetSeconds: state.restTargetSeconds,
          },
          {
            steps,
            currentStep,
            nextStepLabel,
          },
        )
      : buildIdleWorkoutSnapshot()

    await publishWorkoutSnapshot(snapshot)
  }

  async function handleWatchCommand(command: WatchCommand) {
    const state = useActiveWorkoutStore.getState()

    switch (command.type) {
      case 'completeStep':
      case 'logSet': {
        if (!state.startedAt) {
          return
        }

        await state.completeStep(command.exerciseIndex, command.setIndex, {
          weightKg: command.weightKg,
          reps: command.reps,
          rpe: command.rpe,
          setType: command.setType,
        })
        break
      }
      case 'adjustRest':
        state.adjustRest(command.deltaSeconds)
        break
      case 'skipRest':
        state.skipRest()
        break
      case 'nextExercise': {
        const steps = buildCircuitSteps(state.exercises)
        const next = Math.min(state.activeStepIndex + 1, Math.max(steps.length - 1, 0))
        state.goToStep(next)
        break
      }
      case 'prevExercise': {
        const prev = Math.max(state.activeStepIndex - 1, 0)
        state.goToStep(prev)
        break
      }
      case 'ping':
        await publishCurrentSnapshot()
        break
    }
  }

  return { watchAvailable }
}

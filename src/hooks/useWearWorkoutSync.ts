import { useEffect, useRef, useState } from 'react'

import {
  buildIdleWorkoutSnapshot,
  buildWorkoutSnapshot,
  type WatchCommand,
} from '@/lib/wear/workout-sync-protocol'
import {
  formatWearWatchStatusLabel,
  getWearWatchStatus,
  publishWorkoutSnapshot,
  subscribeToWatchCommands,
  type WearWatchStatus,
} from '@/lib/wear/wear-bridge'
import {
  buildCircuitSteps,
  getStepLabel,
  findNextStepIndexAfter,
} from '@/lib/workout/workout-circuit'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'

const WATCH_POLL_INTERVAL_MS = 1_000

export function useWearWorkoutSync(enabled = true) {
  const [watchStatus, setWatchStatus] = useState<WearWatchStatus>({
    available: false,
    paired: false,
    hasRcoachWear: false,
  })
  const syncActiveRef = useRef(false)
  const watchAvailable = watchStatus.available

  useEffect(() => {
    if (!enabled) {
      setWatchStatus({
        available: false,
        paired: false,
        hasRcoachWear: false,
      })
      return
    }

    let cancelled = false
    let unsubscribeCommands: (() => void) | undefined
    let pollTimer: ReturnType<typeof setInterval> | undefined

    async function ensureWatchSync() {
      const status = await getWearWatchStatus()
      if (cancelled) {
        return status.available
      }

      setWatchStatus(status)

      if (status.available && !syncActiveRef.current) {
        unsubscribeCommands = await subscribeToWatchCommands(handleWatchCommand)
        syncActiveRef.current = true
        await publishCurrentSnapshot()
      }

      if (!status.available && syncActiveRef.current) {
        unsubscribeCommands?.()
        unsubscribeCommands = undefined
        syncActiveRef.current = false
      }

      return status.available
    }

    void ensureWatchSync()
    pollTimer = setInterval(() => {
      void ensureWatchSync()
    }, WATCH_POLL_INTERVAL_MS)

    const unsubscribeStore = useActiveWorkoutStore.subscribe(() => {
      if (syncActiveRef.current) {
        void publishCurrentSnapshot()
      }
    })

    return () => {
      cancelled = true
      if (pollTimer) {
        clearInterval(pollTimer)
      }
      unsubscribeStore()
      unsubscribeCommands?.()
      syncActiveRef.current = false
    }
  }, [enabled])

  async function publishCurrentSnapshot() {
    const state = useActiveWorkoutStore.getState()
    const steps = buildCircuitSteps(state.exercises)
    const currentStep = steps[state.activeStepIndex] ?? null
    const nextIndex = findNextStepIndexAfter(steps, state.exercises, state.lastCompletedStep)
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
    setWatchStatus((current) => ({
      ...current,
      available: true,
    }))
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

  return {
    watchAvailable,
    watchStatus,
    watchStatusLabel: formatWearWatchStatusLabel(watchStatus),
  }
}

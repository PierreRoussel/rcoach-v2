export const WEAR_SNAPSHOT_PATH = '/rcoach/workout_snapshot'
export const WEAR_COMMAND_PATH = '/rcoach/watch_command'
export const WEAR_OPEN_SESSION_PATH = '/rcoach/open_session'

export type WorkoutSetValues = {
  weightKg: number | null
  reps: number | null
  rpe?: number | null
}

export type WorkoutSnapshotPreviousSet = {
  weightKg: number | null
  reps: number | null
}

export type WorkoutSnapshotCurrentStep = {
  exerciseIndex: number
  setIndex: number
  exerciseName: string
  setNumber: number
  totalSets: number
  weightKg: number | null
  reps: number | null
  rpe?: number | null
  previousSet?: WorkoutSnapshotPreviousSet | null
}

export type WorkoutSnapshotExercise = {
  exerciseId: string
  exerciseName: string
  setsCount: number
  completedSetsCount: number
  suggestedSet: WorkoutSetValues
}

export type WorkoutSnapshot = {
  sessionId: string | null
  title: string
  activeStepIndex: number
  totalSteps: number
  currentStep: WorkoutSnapshotCurrentStep | null
  nextStepLabel: string | null
  exercises: WorkoutSnapshotExercise[]
  isResting: boolean
  restSecondsLeft: number
  restTargetSeconds: number
  defaultRestSeconds: number
  heartRateBpm?: number | null
  estimatedKcal?: number | null
  updatedAt: string
}

export type WatchCompleteStepCommand = {
  type: 'completeStep'
  exerciseIndex: number
  setIndex: number
  weightKg: number | null
  reps: number | null
  rpe?: number | null
  setType: 'normal' | 'warmup' | 'failure'
}

/** @deprecated Use completeStep */
export type WatchLogSetCommand = WatchCompleteStepCommand & { type: 'logSet' }

export type WatchCommand =
  | WatchCompleteStepCommand
  | WatchLogSetCommand
  | { type: 'skipRest' }
  | { type: 'adjustRest'; deltaSeconds: number }
  | { type: 'nextExercise' }
  | { type: 'prevExercise' }
  | { type: 'ping' }

export type ActiveWorkoutSnapshotSource = {
  title: string
  startedAt: string | null
  defaultRestSeconds: number
  exercises: Array<{
    exerciseId: string
    exerciseName: string
    sets: Array<{
      setIndex: number
      weightKg: number | null
      reps: number | null
      rpe?: number | null
      completedAt?: string | null
    }>
  }>
  activeStepIndex: number
  restTargetSeconds: number
  isResting: boolean
  restSecondsLeft: number
}

export function getPreviousSetValues(
  sets: Array<{
    weightKg: number | null
    reps: number | null
    completedAt?: string | null
  }>,
  setIndex: number,
): WorkoutSnapshotPreviousSet | null {
  if (setIndex > 0) {
    const previous = sets[setIndex - 1]
    if (previous) {
      return {
        weightKg: previous.weightKg,
        reps: previous.reps,
      }
    }
  }

  const lastCompleted = [...sets].reverse().find((set) => Boolean(set.completedAt))
  if (!lastCompleted) {
    return null
  }

  return {
    weightKg: lastCompleted.weightKg,
    reps: lastCompleted.reps,
  }
}

export function getSuggestedSetValues(
  sets: Array<{
    weightKg: number | null
    reps: number | null
    rpe?: number | null
    completedAt?: string | null
  }>,
  setIndex?: number,
): WorkoutSetValues {
  if (setIndex != null) {
    const planned = sets[setIndex]
    if (planned) {
      return {
        weightKg: planned.weightKg,
        reps: planned.reps,
        rpe: planned.rpe ?? null,
      }
    }
  }

  const lastCompleted = [...sets].reverse().find((set) => Boolean(set.completedAt))
  const lastSet = lastCompleted ?? sets.at(-1)

  return {
    weightKg: lastSet?.weightKg ?? null,
    reps: lastSet?.reps ?? null,
    rpe: lastSet?.rpe ?? null,
  }
}

export function buildWorkoutSnapshot(
  source: ActiveWorkoutSnapshotSource,
  options?: {
    steps?: Array<{ exerciseIndex: number; setIndex: number }>
    currentStep?: { exerciseIndex: number; setIndex: number } | null
    nextStepLabel?: string | null
  },
): WorkoutSnapshot {
  const steps = options?.steps ?? []
  const currentStep = options?.currentStep ?? steps[source.activeStepIndex] ?? null
  const currentExercise =
    currentStep != null ? source.exercises[currentStep.exerciseIndex] : null
  const currentSet =
    currentStep != null ? currentExercise?.sets[currentStep.setIndex] : null

  return {
    sessionId: source.startedAt,
    title: source.title,
    activeStepIndex: source.activeStepIndex,
    totalSteps: steps.length,
    currentStep: currentStep
      ? {
          exerciseIndex: currentStep.exerciseIndex,
          setIndex: currentStep.setIndex,
          exerciseName: currentExercise?.exerciseName ?? 'Exercice',
          setNumber: currentStep.setIndex + 1,
          totalSets: currentExercise?.sets.length ?? 0,
          weightKg: currentSet?.weightKg ?? null,
          reps: currentSet?.reps ?? null,
          rpe: currentSet?.rpe ?? null,
          previousSet: currentExercise
            ? getPreviousSetValues(currentExercise.sets, currentStep.setIndex)
            : null,
        }
      : null,
    nextStepLabel: options?.nextStepLabel ?? null,
    exercises: source.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      setsCount: exercise.sets.length,
      completedSetsCount: exercise.sets.filter((set) => Boolean(set.completedAt)).length,
      suggestedSet: getSuggestedSetValues(exercise.sets),
    })),
    isResting: source.isResting,
    restSecondsLeft: source.restSecondsLeft,
    restTargetSeconds: source.restTargetSeconds,
    defaultRestSeconds: source.defaultRestSeconds,
    updatedAt: new Date().toISOString(),
  }
}

export function buildIdleWorkoutSnapshot(): WorkoutSnapshot {
  return {
    sessionId: null,
    title: '',
    activeStepIndex: 0,
    totalSteps: 0,
    currentStep: null,
    nextStepLabel: null,
    exercises: [],
    isResting: false,
    restSecondsLeft: 0,
    restTargetSeconds: 0,
    defaultRestSeconds: 90,
    updatedAt: new Date().toISOString(),
  }
}

export function encodeWorkoutSnapshot(snapshot: WorkoutSnapshot) {
  return JSON.stringify(snapshot)
}

export function decodeWorkoutSnapshot(payload: string): WorkoutSnapshot {
  return JSON.parse(payload) as WorkoutSnapshot
}

export function encodeWatchCommand(command: WatchCommand) {
  return JSON.stringify(command)
}

export function decodeWatchCommand(payload: string): WatchCommand {
  const parsed = JSON.parse(payload) as WatchCommand

  if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
    throw new Error('Invalid watch command payload.')
  }

  return parsed
}

export function adjustWeightKg(current: number | null, delta: number) {
  const base = current ?? 0
  return Math.max(0, Math.round((base + delta) * 2) / 2)
}

export function adjustReps(current: number | null, delta: number) {
  const base = current ?? 0
  return Math.max(0, base + delta)
}

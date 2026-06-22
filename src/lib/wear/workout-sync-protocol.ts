export const WEAR_SNAPSHOT_PATH = '/rcoach/workout_snapshot'
export const WEAR_COMMAND_PATH = '/rcoach/watch_command'

export type WorkoutSetValues = {
  weightKg: number | null
  reps: number | null
}

export type WorkoutSnapshotExercise = {
  exerciseId: string
  exerciseName: string
  setsCount: number
  suggestedSet: WorkoutSetValues
}

export type WorkoutSnapshot = {
  sessionId: string | null
  title: string
  activeExerciseIndex: number
  exercises: WorkoutSnapshotExercise[]
  isResting: boolean
  restSecondsLeft: number
  defaultRestSeconds: number
  updatedAt: string
}

export type WatchLogSetCommand = {
  type: 'logSet'
  exerciseIndex: number
  weightKg: number | null
  reps: number | null
  setType: 'normal' | 'warmup' | 'failure'
}

export type WatchCommand =
  | WatchLogSetCommand
  | { type: 'skipRest' }
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
      weightKg: number | null
      reps: number | null
    }>
  }>
  activeExerciseIndex: number
  isResting: boolean
  restSecondsLeft: number
}

export function getSuggestedSetValues(
  sets: Array<{ weightKg: number | null; reps: number | null }>,
): WorkoutSetValues {
  const lastSet = sets.at(-1)

  return {
    weightKg: lastSet?.weightKg ?? null,
    reps: lastSet?.reps ?? null,
  }
}

export function getNextSetNumber(setsCount: number) {
  return setsCount + 1
}

export function buildWorkoutSnapshot(
  source: ActiveWorkoutSnapshotSource,
): WorkoutSnapshot {
  return {
    sessionId: source.startedAt,
    title: source.title,
    activeExerciseIndex: source.activeExerciseIndex,
    exercises: source.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      setsCount: exercise.sets.length,
      suggestedSet: getSuggestedSetValues(exercise.sets),
    })),
    isResting: source.isResting,
    restSecondsLeft: source.restSecondsLeft,
    defaultRestSeconds: source.defaultRestSeconds,
    updatedAt: new Date().toISOString(),
  }
}

export function buildIdleWorkoutSnapshot(): WorkoutSnapshot {
  return {
    sessionId: null,
    title: '',
    activeExerciseIndex: 0,
    exercises: [],
    isResting: false,
    restSecondsLeft: 0,
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

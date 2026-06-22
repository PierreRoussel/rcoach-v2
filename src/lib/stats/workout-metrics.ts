import { format, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'

import type { WorkoutSummary } from '@/lib/graphql/operations'
import { estimateOneRepMax } from '@/lib/stats/strength-benchmarks'

type WorkoutSet = WorkoutSummary['workout_exercises'][number]['sets'][number]
type WorkoutExercise = WorkoutSummary['workout_exercises'][number]

function isWorkingSet(set: WorkoutSet) {
  return set.set_type !== 'warmup' && set.reps != null && set.reps > 0
}

function scoreSet(weightKg: number | null, reps: number | null) {
  return (weightKg ?? 0) * (reps ?? 0)
}

function getExerciseKey(entry: WorkoutExercise) {
  return entry.exercise.id ?? entry.exercise.name
}

export function computeWorkoutVolume(workout: WorkoutSummary): number {
  let volume = 0

  for (const entry of workout.workout_exercises) {
    for (const set of entry.sets) {
      if (set.weight_kg != null && set.reps != null) {
        volume += set.weight_kg * set.reps
      }
    }
  }

  return volume
}

export function formatWorkoutDuration(
  startedAt: string,
  endedAt: string | null,
): string | null {
  if (endedAt == null) {
    return null
  }

  const minutes = Math.round(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000,
  )

  if (minutes < 1) {
    return '<1min'
  }

  if (minutes < 60) {
    return `${minutes}min`
  }

  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60

  return remainder > 0 ? `${hours}h${String(remainder).padStart(2, '0')}` : `${hours}h`
}

export function formatWorkoutDateTime(date: string | Date): string {
  const value = typeof date === 'string' ? new Date(date) : date
  const time = format(value, 'HH:mm', { locale: fr })

  if (isToday(value)) {
    return `Aujourd'hui à ${time}`
  }

  if (isYesterday(value)) {
    return `Hier à ${time}`
  }

  return format(value, "d MMMM 'à' HH:mm", { locale: fr })
}

export function formatWorkoutVolume(kg: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(kg))} kg`
}

type ExerciseBest = {
  volume: number
  oneRm: number
}

function isPersonalRecord(
  set: WorkoutSet,
  previousBest: ExerciseBest | undefined,
): boolean {
  if (!isWorkingSet(set) || set.weight_kg == null || set.reps == null) {
    return false
  }

  const volume = scoreSet(set.weight_kg, set.reps)
  const oneRm = estimateOneRepMax(set.weight_kg, set.reps)
  const best = previousBest ?? { volume: 0, oneRm: 0 }

  return volume > best.volume || oneRm > best.oneRm
}

function applySetToBest(set: WorkoutSet, previousBest: ExerciseBest | undefined): ExerciseBest {
  if (!isWorkingSet(set) || set.weight_kg == null || set.reps == null) {
    return previousBest ?? { volume: 0, oneRm: 0 }
  }

  const volume = scoreSet(set.weight_kg, set.reps)
  const oneRm = estimateOneRepMax(set.weight_kg, set.reps)
  const best = previousBest ?? { volume: 0, oneRm: 0 }

  return {
    volume: Math.max(best.volume, volume),
    oneRm: Math.max(best.oneRm, oneRm),
  }
}

function accumulateWorkoutBests(
  workout: WorkoutSummary,
  bests: Map<string, ExerciseBest>,
) {
  for (const entry of workout.workout_exercises) {
    const key = getExerciseKey(entry)

    for (const set of entry.sets) {
      const current = bests.get(key)
      bests.set(key, applySetToBest(set, current))
    }
  }
}

export function countWorkoutPersonalRecords(
  targetWorkout: WorkoutSummary,
  allWorkouts: WorkoutSummary[],
): number {
  const targetTime = new Date(targetWorkout.started_at).getTime()
  const historicalBests = new Map<string, ExerciseBest>()

  for (const workout of allWorkouts) {
    if (workout.id === targetWorkout.id) {
      continue
    }

    if (new Date(workout.started_at).getTime() >= targetTime) {
      continue
    }

    accumulateWorkoutBests(workout, historicalBests)
  }

  const runningBests = new Map(historicalBests)
  let prCount = 0

  for (const entry of targetWorkout.workout_exercises) {
    const key = getExerciseKey(entry)

    for (const set of entry.sets) {
      const previousBest = runningBests.get(key)

      if (isPersonalRecord(set, previousBest)) {
        prCount += 1
      }

      runningBests.set(key, applySetToBest(set, previousBest))
    }
  }

  return prCount
}

export function getProfileInitials(displayName: string): string {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

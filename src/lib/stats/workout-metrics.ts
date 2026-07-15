import { format, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'

import type { ActiveExerciseDraft } from '@/lib/db/dexie'
import type { WorkoutSummary } from '@/lib/graphql/operations'
import { KCAL_PER_KG } from '@/lib/goals/weight-goal'
import { estimateOneRepMax } from '@/lib/stats/strength-benchmarks'
import type { CircuitExercise } from '@/lib/workout/workout-circuit'

type WorkoutSet = WorkoutSummary['workout_exercises'][number]['sets'][number]
type WorkoutExercise = WorkoutSummary['workout_exercises'][number]

export type PersonalRecordKind = 'volume' | 'oneRm'

export type PersonalRecordHit = {
  exerciseId: string
  exerciseName: string
  exerciseNameFr?: string | null
  weightKg: number
  reps: number
  kinds: PersonalRecordKind[]
}

type DraftExerciseInput = Pick<
  ActiveExerciseDraft,
  'exerciseId' | 'exerciseName' | 'sets'
> | CircuitExercise

function isWorkingSet(set: WorkoutSet) {
  return set.set_type !== 'warmup' && set.reps != null && set.reps > 0
}

function scoreSet(weightKg: number | null, reps: number | null) {
  return (weightKg ?? 0) * (reps ?? 0)
}

function getExerciseKey(entry: WorkoutExercise) {
  return entry.exercise?.id ?? entry.exercise?.name ?? entry.id
}

function getExerciseMeta(entry: WorkoutExercise) {
  return {
    key: getExerciseKey(entry),
    exerciseId: entry.exercise?.id ?? entry.id,
    exerciseName: entry.exercise?.name ?? 'Exercice supprimé',
    exerciseNameFr: entry.exercise?.name_fr ?? null,
  }
}

export function computeDraftVolume(exercises: DraftExerciseInput[]): number {
  let volume = 0

  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      const weight = set.weightKg ?? null
      const reps = set.reps ?? null
      if (weight != null && reps != null) {
        volume += weight * reps
      }
    }
  }

  return volume
}

export function draftToWorkoutSummary(
  draft: {
    title: string
    startedAt: string
    exercises: DraftExerciseInput[]
  },
  endedAt: string,
): WorkoutSummary {
  return {
    id: '__draft__',
    title: draft.title,
    started_at: draft.startedAt,
    ended_at: endedAt,
    workout_exercises: draft.exercises.map((exercise, index) => ({
      id: `draft-exercise-${index}`,
      exercise: {
        id: exercise.exerciseId,
        name: exercise.exerciseName,
        name_fr:
          'exerciseNameFr' in exercise ? exercise.exerciseNameFr ?? null : null,
        muscle_group: null,
        equipment: null,
      },
      sets: exercise.sets.map((set, setIndex) => ({
        set_index: setIndex,
        weight_kg: set.weightKg ?? null,
        reps: set.reps ?? null,
        set_type: set.setType ?? 'normal',
        rpe: set.rpe ?? null,
      })),
    })),
  }
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

const DEFAULT_BODY_WEIGHT_KG = 70

export function getWorkoutDurationMinutes(startedAt: string, endedAt: string): number {
  const minutes = Math.round(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000,
  )

  return Math.max(1, minutes)
}

function resolveStrengthTrainingMet(
  durationMinutes: number,
  volumeKg: number,
  completedSets: number,
  avgHeartRateBpm?: number | null,
): number {
  const volumePerMinute = volumeKg / durationMinutes
  let met = 4.5

  if (volumePerMinute >= 80 || completedSets >= 20) {
    met = 6
  } else if (volumePerMinute >= 40 || completedSets >= 12) {
    met = 5.5
  } else if (volumePerMinute >= 15 || completedSets >= 8) {
    met = 5
  }

  if (avgHeartRateBpm != null && avgHeartRateBpm >= 100) {
    const heartRateBoost = Math.min(1.5, Math.max(0, (avgHeartRateBpm - 100) / 60))
    met += heartRateBoost
  }

  return met
}

export function estimateWorkoutCalories(input: {
  startedAt: string
  endedAt: string
  volumeKg: number
  completedSets: number
  bodyWeightKg?: number | null
  avgHeartRateBpm?: number | null
}): number {
  const durationMinutes = getWorkoutDurationMinutes(input.startedAt, input.endedAt)
  const durationHours = durationMinutes / 60
  const bodyWeightKg =
    input.bodyWeightKg != null && input.bodyWeightKg > 0
      ? input.bodyWeightKg
      : DEFAULT_BODY_WEIGHT_KG
  const met = resolveStrengthTrainingMet(
    durationMinutes,
    input.volumeKg,
    input.completedSets,
    input.avgHeartRateBpm,
  )

  return Math.round(Math.max(1, met * bodyWeightKg * durationHours))
}

export function formatWorkoutCalories(kcal: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(kcal)} kcal`
}

/** Équivalent masse grasse (7700 kcal ≈ 1 kg), aligné sur les objectifs poids. */
export function estimateFatGramsFromCalories(kcal: number): number {
  if (kcal <= 0) {
    return 0
  }

  const grams = (kcal / KCAL_PER_KG) * 1000
  return Math.round(grams * 10) / 10
}

export function formatWorkoutFatEquivalent(kcal: number): string {
  const grams = estimateFatGramsFromCalories(kcal)
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: grams >= 10 ? 0 : 1,
  }).format(grams)

  return `${formatted} g`
}

type ExerciseBest = {
  volume: number
  oneRm: number
}

function getPersonalRecordKinds(
  set: WorkoutSet,
  previousBest: ExerciseBest | undefined,
): PersonalRecordKind[] {
  if (!isWorkingSet(set) || set.weight_kg == null || set.reps == null) {
    return []
  }

  const volume = scoreSet(set.weight_kg, set.reps)
  const oneRm = estimateOneRepMax(set.weight_kg, set.reps)
  const best = previousBest ?? { volume: 0, oneRm: 0 }
  const kinds: PersonalRecordKind[] = []

  if (volume > best.volume) {
    kinds.push('volume')
  }

  if (oneRm > best.oneRm) {
    kinds.push('oneRm')
  }

  return kinds
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

function buildHistoricalBests(
  targetWorkout: WorkoutSummary,
  allWorkouts: WorkoutSummary[],
): Map<string, ExerciseBest> {
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

  return historicalBests
}

function dedupeRecordsByExercise(records: PersonalRecordHit[]): PersonalRecordHit[] {
  const bestByExercise = new Map<string, PersonalRecordHit>()

  for (const record of records) {
    const existing = bestByExercise.get(record.exerciseId)
    const recordOneRm = estimateOneRepMax(record.weightKg, record.reps)

    if (!existing) {
      bestByExercise.set(record.exerciseId, record)
      continue
    }

    const existingOneRm = estimateOneRepMax(existing.weightKg, existing.reps)
    if (recordOneRm > existingOneRm) {
      bestByExercise.set(record.exerciseId, record)
      continue
    }

    if (recordOneRm === existingOneRm) {
      const mergedKinds = [...new Set([...existing.kinds, ...record.kinds])]
      bestByExercise.set(record.exerciseId, { ...existing, kinds: mergedKinds })
    }
  }

  return [...bestByExercise.values()]
}

export function detectWorkoutPersonalRecords(
  targetWorkout: WorkoutSummary,
  allWorkouts: WorkoutSummary[],
): PersonalRecordHit[] {
  const runningBests = buildHistoricalBests(targetWorkout, allWorkouts)
  const hits: PersonalRecordHit[] = []

  for (const entry of targetWorkout.workout_exercises) {
    const { key, exerciseId, exerciseName, exerciseNameFr } = getExerciseMeta(entry)

    for (const set of entry.sets) {
      const previousBest = runningBests.get(key)
      const kinds = getPersonalRecordKinds(set, previousBest)

      if (kinds.length > 0 && set.weight_kg != null && set.reps != null) {
        hits.push({
          exerciseId,
          exerciseName,
          exerciseNameFr,
          weightKg: set.weight_kg,
          reps: set.reps,
          kinds,
        })
      }

      runningBests.set(key, applySetToBest(set, previousBest))
    }
  }

  return dedupeRecordsByExercise(hits)
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

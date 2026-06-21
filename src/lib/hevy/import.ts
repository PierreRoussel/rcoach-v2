import { parse } from 'date-fns'
import { fr } from 'date-fns/locale'
import Papa from 'papaparse'

import type { Exercise } from '@/lib/graphql/operations'

export type HevyRow = {
  title: string
  start_time: string
  end_time: string
  description: string
  exercise_title: string
  superset_id: string
  exercise_notes: string
  set_index: string
  set_type: string
  weight_kg: string
  reps: string
  distance_km: string
  duration_seconds: string
  rpe: string
}

export type ParsedHevyWorkout = {
  title: string
  startedAt: string
  endedAt: string | null
  exercises: Array<{
    exerciseName: string
    sortOrder: number
    supersetId: number | null
    notes: string | null
    sets: Array<{
      setIndex: number
      setType: 'normal' | 'warmup' | 'failure'
      weightKg: number | null
      reps: number | null
      distanceKm: number | null
      durationSeconds: number | null
      rpe: number | null
    }>
  }>
}

function parseHevyDate(value: string): string | null {
  if (!value.trim()) {
    return null
  }

  const parsed = parse(value.trim(), 'd MMMM yyyy, HH:mm', new Date(), {
    locale: fr,
  })

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}

function parseNumber(value: string): number | null {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeSetType(value: string): 'normal' | 'warmup' | 'failure' {
  if (value === 'warmup' || value === 'failure') {
    return value
  }

  return 'normal'
}

export function parseHevyCsv(content: string): ParsedHevyWorkout[] {
  const parsed = Papa.parse<HevyRow>(content, {
    header: true,
    skipEmptyLines: true,
  })

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? 'CSV Hevy invalide')
  }

  const grouped = new Map<string, HevyRow[]>()

  for (const row of parsed.data) {
    const key = `${row.title}::${row.start_time}`
    const bucket = grouped.get(key) ?? []
    bucket.push(row)
    grouped.set(key, bucket)
  }

  const workouts: ParsedHevyWorkout[] = []

  for (const rows of grouped.values()) {
    const first = rows[0]
    if (!first) {
      continue
    }

    const startedAt = parseHevyDate(first.start_time)
    if (!startedAt) {
      continue
    }

    const endedAt = parseHevyDate(first.end_time)
    const exerciseOrder: string[] = []
    const exerciseMap = new Map<
      string,
      ParsedHevyWorkout['exercises'][number]
    >()

    for (const row of rows) {
      const exerciseName = row.exercise_title.trim()
      if (!exerciseName) {
        continue
      }

      if (!exerciseMap.has(exerciseName)) {
        exerciseOrder.push(exerciseName)
        exerciseMap.set(exerciseName, {
          exerciseName,
          sortOrder: exerciseOrder.length - 1,
          supersetId: parseNumber(row.superset_id),
          notes: row.exercise_notes.trim() || null,
          sets: [],
        })
      }

      const exercise = exerciseMap.get(exerciseName)
      if (!exercise) {
        continue
      }

      exercise.sets.push({
        setIndex: parseNumber(row.set_index) ?? exercise.sets.length,
        setType: normalizeSetType(row.set_type),
        weightKg: parseNumber(row.weight_kg),
        reps: parseNumber(row.reps),
        distanceKm: parseNumber(row.distance_km),
        durationSeconds: parseNumber(row.duration_seconds),
        rpe: parseNumber(row.rpe),
      })
    }

    workouts.push({
      title: first.title.trim() || 'Import Hevy',
      startedAt,
      endedAt,
      exercises: exerciseOrder
        .map((name) => exerciseMap.get(name))
        .filter((exercise): exercise is ParsedHevyWorkout['exercises'][number] =>
          Boolean(exercise),
        ),
    })
  }

  return workouts.sort(
    (left, right) =>
      new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
  )
}

export function mapHevyWorkoutToInsertInput(
  workout: ParsedHevyWorkout,
  exerciseLookup: Map<string, Exercise>,
) {
  const workoutExercises = workout.exercises
    .map((exercise, sortOrder) => {
      const match = exerciseLookup.get(exercise.exerciseName.toLowerCase())
      if (!match) {
        return null
      }

      return {
        sort_order: sortOrder,
        exercise_id: match.id,
        superset_id: exercise.supersetId,
        notes: exercise.notes,
        sets: {
          data: exercise.sets.map((set) => ({
            set_index: set.setIndex,
            set_type: set.setType,
            weight_kg: set.weightKg,
            reps: set.reps,
            distance_km: set.distanceKm,
            duration_seconds: set.durationSeconds,
            rpe: set.rpe,
          })),
        },
      }
    })
    .filter((exercise): exercise is NonNullable<typeof exercise> =>
      Boolean(exercise),
    )

  if (workoutExercises.length === 0) {
    return null
  }

  return {
    title: workout.title,
    started_at: workout.startedAt,
    ended_at: workout.endedAt,
    workout_exercises: { data: workoutExercises },
  }
}

export function buildExerciseLookup(exercises: Exercise[]) {
  return new Map(
    exercises.map((exercise) => [exercise.name.toLowerCase(), exercise]),
  )
}

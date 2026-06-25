import type { WorkoutSummary } from '@/lib/graphql/operations'
import type { MuscleGroup } from '@/lib/workout/exercise-meta'
import {
  MUSCLE_GROUP_LABELS,
  normalizeMuscleGroup,
  RADAR_MUSCLE_GROUPS,
} from '@/lib/stats/muscle-groups'
import {
  getStrengthPercentile,
  type StrengthPercentileResult,
} from '@/lib/stats/strength-benchmarks'

export type MuscleVolumeStat = {
  muscle: MuscleGroup
  label: string
  volume: number
  sets: number
  sessions: number
  intensity: number
}

export type RadarMusclePoint = {
  muscle: string
  label: string
  value: number
  fullMark: number
}

export type TopExerciseByZone = {
  muscle: MuscleGroup
  label: string
  exerciseId: string | null
  exerciseName: string
  sets: number
  volume: number
  bestWeightKg: number
  bestReps: number
  strength: StrengthPercentileResult | null
}

type ExerciseAccumulator = {
  exerciseId: string
  name: string
  sets: number
  volume: number
  bestWeightKg: number
  bestReps: number
}

function isWorkingSet(set: { set_type: string; weight_kg: number | null; reps: number | null }) {
  return set.set_type !== 'warmup' && set.reps != null && set.reps > 0
}

function scoreSet(weightKg: number | null, reps: number | null) {
  return (weightKg ?? 0) * (reps ?? 0)
}

export function computeMuscleVolumeStats(
  workouts: WorkoutSummary[] | undefined,
): MuscleVolumeStat[] {
  const totals = new Map<MuscleGroup, { volume: number; sets: number; sessions: Set<string> }>()

  for (const workout of workouts ?? []) {
    const musclesInSession = new Set<MuscleGroup>()

    for (const entry of workout.workout_exercises) {
      const muscle = normalizeMuscleGroup(entry.exercise.muscle_group)

      for (const set of entry.sets) {
        if (!isWorkingSet(set)) {
          continue
        }

        const current = totals.get(muscle) ?? { volume: 0, sets: 0, sessions: new Set() }
        current.volume += scoreSet(set.weight_kg, set.reps)
        current.sets += 1
        musclesInSession.add(muscle)
        totals.set(muscle, current)
      }
    }

    for (const muscle of musclesInSession) {
      totals.get(muscle)?.sessions.add(workout.id)
    }
  }

  const maxVolume = Math.max(
    ...[...totals.values()].map((item) => item.volume),
    1,
  )

  return RADAR_MUSCLE_GROUPS.map((muscle) => {
    const data = totals.get(muscle) ?? { volume: 0, sets: 0, sessions: new Set() }

    return {
      muscle,
      label: MUSCLE_GROUP_LABELS[muscle],
      volume: data.volume,
      sets: data.sets,
      sessions: data.sessions.size,
      intensity: data.volume / maxVolume,
    }
  })
}

export function computeRadarData(
  muscleStats: MuscleVolumeStat[],
): RadarMusclePoint[] {
  const maxSets = Math.max(...muscleStats.map((item) => item.sets), 1)

  return muscleStats.map((item) => ({
    muscle: item.muscle,
    label: item.label,
    value: Math.round((item.sets / maxSets) * 100),
    fullMark: 100,
  }))
}

export function computeTopExerciseByZone(
  workouts: WorkoutSummary[] | undefined,
): TopExerciseByZone[] {
  const byMuscle = new Map<MuscleGroup, Map<string, ExerciseAccumulator>>()

  for (const workout of workouts ?? []) {
    for (const entry of workout.workout_exercises) {
      const muscle = normalizeMuscleGroup(entry.exercise.muscle_group)
      const exerciseMap = byMuscle.get(muscle) ?? new Map<string, ExerciseAccumulator>()
      const current = exerciseMap.get(entry.exercise.id) ?? {
        exerciseId: entry.exercise.id,
        name: entry.exercise.name,
        sets: 0,
        volume: 0,
        bestWeightKg: 0,
        bestReps: 0,
      }

      for (const set of entry.sets) {
        if (!isWorkingSet(set)) {
          continue
        }

        current.sets += 1
        current.volume += scoreSet(set.weight_kg, set.reps)

        const setScore = scoreSet(set.weight_kg, set.reps)
        const bestScore = current.bestWeightKg * current.bestReps
        if (setScore > bestScore) {
          current.bestWeightKg = set.weight_kg ?? 0
          current.bestReps = set.reps ?? 0
        }
      }

      exerciseMap.set(entry.exercise.id, current)
      byMuscle.set(muscle, exerciseMap)
    }
  }

  return RADAR_MUSCLE_GROUPS.map((muscle) => {
    const exercises = [...(byMuscle.get(muscle)?.values() ?? [])]
    const top = exercises.sort((left, right) => {
      if (right.sets !== left.sets) {
        return right.sets - left.sets
      }
      return right.volume - left.volume
    })[0]

    if (!top) {
      return {
        muscle,
        label: MUSCLE_GROUP_LABELS[muscle],
        exerciseId: null,
        exerciseName: '—',
        sets: 0,
        volume: 0,
        bestWeightKg: 0,
        bestReps: 0,
        strength: null,
      }
    }

    return {
      muscle,
      label: MUSCLE_GROUP_LABELS[muscle],
      exerciseId: top.exerciseId,
      exerciseName: top.name,
      sets: top.sets,
      volume: top.volume,
      bestWeightKg: top.bestWeightKg,
      bestReps: top.bestReps,
      strength: getStrengthPercentile(
        top.name,
        muscle,
        top.bestWeightKg,
        top.bestReps,
      ),
    }
  }).filter((item) => item.sets > 0)
}

export function getBodyRegionIntensity(
  muscleStats: MuscleVolumeStat[],
): Record<string, number> {
  const map = Object.fromEntries(muscleStats.map((item) => [item.muscle, item.intensity])) as Record<
    MuscleGroup,
    number
  >

  return {
    chest: map.chest ?? 0,
    abs: map.abs ?? 0,
    shoulders: map.shoulders ?? 0,
    biceps: map.biceps ?? 0,
    triceps: map.triceps ?? 0,
    back: map.back ?? 0,
    glutes: map.glutes ?? 0,
    legs: map.legs ?? 0,
    forearms: Math.max(map.biceps ?? 0, map.triceps ?? 0) * 0.35,
    calves: (map.legs ?? 0) * 0.45,
  }
}

import type { WorkoutSummary } from '@/lib/graphql/operations'
import { estimateOneRepMax } from '@/lib/stats/strength-benchmarks'

export type WorkoutSet = WorkoutSummary['workout_exercises'][number]['sets'][number]

export const HIGH_RPE_THRESHOLD = 8

export function isHighRpeSet(rpe: number | null | undefined): boolean {
  return rpe != null && rpe >= HIGH_RPE_THRESHOLD
}

export function isWorkingSet(set: Pick<WorkoutSet, 'set_type' | 'reps'>) {
  return set.set_type !== 'warmup' && set.reps != null && set.reps > 0
}

export function setEstimatedOneRm(set: WorkoutSet): number | null {
  if (!isWorkingSet(set)) {
    return null
  }

  const weight = set.weight_kg ?? 0
  const reps = set.reps ?? 0

  if (weight > 0 && reps > 0) {
    return estimateOneRepMax(weight, reps)
  }

  return null
}

export function bestSetByOneRm(sets: WorkoutSet[]): WorkoutSet | null {
  let best: WorkoutSet | null = null
  let bestOneRm = 0

  for (const set of sets) {
    const oneRm = setEstimatedOneRm(set)
    if (oneRm == null || oneRm <= bestOneRm) {
      continue
    }

    bestOneRm = oneRm
    best = set
  }

  return best
}

export function bestHighRpeSet(sets: WorkoutSet[]): WorkoutSet | null {
  const candidates = sets.filter(
    (set) => isWorkingSet(set) && isHighRpeSet(set.rpe),
  )

  return bestSetByOneRm(candidates)
}

export function bestHighRpeOneRm(sets: WorkoutSet[]): number | null {
  const best = bestHighRpeSet(sets)
  if (!best) {
    return null
  }

  return setEstimatedOneRm(best)
}

export type HighRpeComparison = {
  currentOneRm: number | null
  baselineOneRm: number | null
  deltaKg: number | null
  deltaPercent: number | null
  currentSetLabel: string | null
  baselineSetLabel: string | null
  hasEnoughData: boolean
  baselinePeriodLabel?: string
  currentPeriodLabel?: string
}

export function formatHighRpeComparison(comparison: HighRpeComparison): string {
  if (!comparison.hasEnoughData) {
    return 'Pas assez de séries à RPE ≥ 8 — logguez votre effort pour suivre la progression.'
  }

  if (comparison.currentOneRm == null && comparison.baselineOneRm == null) {
    return 'Aucune série à RPE ≥ 8 sur cette période.'
  }

  if (comparison.currentOneRm == null) {
    return 'Aucune série à RPE ≥ 8 sur la période sélectionnée.'
  }

  if (comparison.baselineOneRm == null) {
    return `1RM estimé (RPE ≥ 8) : ${Math.round(comparison.currentOneRm)} kg.`
  }

  const delta = comparison.deltaKg ?? 0
  const sign = delta > 0 ? '+' : ''
  const percent =
    comparison.deltaPercent != null
      ? ` (${sign}${comparison.deltaPercent.toFixed(1)} %)`
      : ''
  const baselineLabel = comparison.baselinePeriodLabel?.toLowerCase() ?? 'début de période'

  return `${sign}${delta.toFixed(1)} kg est. 1RM vs ${baselineLabel}${percent}`
}

export function buildHighRpeComparison(
  currentOneRm: number | null,
  baselineOneRm: number | null,
  currentSetLabel: string | null = null,
  baselineSetLabel: string | null = null,
): HighRpeComparison {
  const hasEnoughData = currentOneRm != null || baselineOneRm != null
  let deltaKg: number | null = null
  let deltaPercent: number | null = null

  if (currentOneRm != null && baselineOneRm != null && baselineOneRm > 0) {
    deltaKg = currentOneRm - baselineOneRm
    deltaPercent = (deltaKg / baselineOneRm) * 100
  }

  return {
    currentOneRm,
    baselineOneRm,
    deltaKg,
    deltaPercent,
    currentSetLabel,
    baselineSetLabel,
    hasEnoughData,
  }
}

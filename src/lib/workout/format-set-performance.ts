export type SetPerformanceInput = {
  weight_kg?: number | null
  weightKg?: number | null
  reps?: number | null
  rpe?: number | null
  duration_seconds?: number | null
  durationSeconds?: number | null
  distance_km?: number | null
  distanceKm?: number | null
}

function readWeight(set: SetPerformanceInput): number | null {
  return set.weight_kg ?? set.weightKg ?? null
}

function readDuration(set: SetPerformanceInput): number | null {
  return set.duration_seconds ?? set.durationSeconds ?? null
}

function readDistance(set: SetPerformanceInput): number | null {
  return set.distance_km ?? set.distanceKm ?? null
}

function formatRpeValue(rpe: number): string {
  return Number.isInteger(rpe) ? String(rpe) : String(rpe)
}

export function formatSetPerformanceSummary(
  set: SetPerformanceInput,
  options?: { includeRpe?: boolean },
): string | null {
  const weight = readWeight(set)
  const reps = set.reps ?? null
  const includeRpe = options?.includeRpe ?? true

  if (reps != null && weight != null) {
    const base = `${reps}x${weight}kg`
    if (includeRpe && set.rpe != null) {
      return `${base} @${formatRpeValue(set.rpe)}`
    }
    return base
  }

  const duration = readDuration(set)
  if (duration != null) {
    const base = `${duration}s`
    if (includeRpe && set.rpe != null) {
      return `${base} @${formatRpeValue(set.rpe)}`
    }
    return base
  }

  const distance = readDistance(set)
  if (distance != null) {
    const base = `${distance}km`
    if (includeRpe && set.rpe != null) {
      return `${base} @${formatRpeValue(set.rpe)}`
    }
    return base
  }

  if (reps != null) {
    return `${reps} reps`
  }

  if (weight != null) {
    return `${weight}kg`
  }

  return null
}

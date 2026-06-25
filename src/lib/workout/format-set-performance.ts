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

function hasMeaningfulWeight(weight: number | null): boolean {
  return weight != null && weight > 0
}

export function formatSetPerformanceSummary(
  set: SetPerformanceInput,
  options?: { includeRpe?: boolean },
): string | null {
  const weight = readWeight(set)
  const reps = set.reps ?? null
  const includeRpe = options?.includeRpe ?? true

  if (reps != null && hasMeaningfulWeight(weight)) {
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
    const base = `${reps} reps`
    if (includeRpe && set.rpe != null) {
      return `${base} @${formatRpeValue(set.rpe)}`
    }
    return base
  }

  if (hasMeaningfulWeight(weight)) {
    return `${weight}kg`
  }

  return null
}

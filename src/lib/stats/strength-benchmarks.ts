export type StrengthBenchmark = {
  id: string
  label: string
  muscleGroup: string
  patterns: RegExp[]
  percentiles: {
    p10: number
    p25: number
    p50: number
    p75: number
    p90: number
    p95: number
  }
}

/** Repères 1RM (kg) inspirés de standards force amateur — homme ~75 kg, sans catégorie de poids. */
export const STRENGTH_BENCHMARKS: StrengthBenchmark[] = [
  {
    id: 'bench_press',
    label: 'Developpe couche',
    muscleGroup: 'chest',
    patterns: [/bench press/i, /chest press/i, /floor press/i],
    percentiles: { p10: 40, p25: 55, p50: 75, p75: 95, p90: 110, p95: 125 },
  },
  {
    id: 'squat',
    label: 'Squat',
    muscleGroup: 'legs',
    patterns: [/squat/i, /leg press/i, /hack squat/i],
    percentiles: { p10: 50, p25: 70, p50: 100, p75: 130, p90: 160, p95: 180 },
  },
  {
    id: 'deadlift',
    label: 'Souleve de terre',
    muscleGroup: 'back',
    patterns: [/deadlift/i, /romanian deadlift/i, /rdl/i],
    percentiles: { p10: 60, p25: 85, p50: 120, p75: 155, p90: 190, p95: 220 },
  },
  {
    id: 'ohp',
    label: 'Developpe militaire',
    muscleGroup: 'shoulders',
    patterns: [/overhead press/i, /military press/i, /shoulder press/i, /arnold press/i],
    percentiles: { p10: 25, p25: 35, p50: 50, p75: 62, p90: 75, p95: 85 },
  },
  {
    id: 'row',
    label: 'Rowing',
    muscleGroup: 'back',
    patterns: [/row/i, /pulldown/i, /pull-up/i, /chin-up/i, /lat pulldown/i],
    percentiles: { p10: 30, p25: 45, p50: 65, p75: 85, p90: 100, p95: 115 },
  },
  {
    id: 'curl',
    label: 'Curl biceps',
    muscleGroup: 'biceps',
    patterns: [/curl/i, /biceps/i],
    percentiles: { p10: 12, p25: 18, p50: 28, p75: 38, p90: 48, p95: 55 },
  },
  {
    id: 'triceps',
    label: 'Extension triceps',
    muscleGroup: 'triceps',
    patterns: [/triceps/i, /skull crush/i, /pushdown/i, /dip/i],
    percentiles: { p10: 15, p25: 22, p50: 32, p75: 42, p90: 52, p95: 60 },
  },
  {
    id: 'hip_thrust',
    label: 'Hip thrust',
    muscleGroup: 'glutes',
    patterns: [/hip thrust/i, /glute bridge/i],
    percentiles: { p10: 40, p25: 60, p50: 90, p75: 120, p90: 150, p95: 170 },
  },
  {
    id: 'lunge',
    label: 'Fentes',
    muscleGroup: 'legs',
    patterns: [/lunge/i, /split squat/i],
    percentiles: { p10: 20, p25: 30, p50: 45, p75: 60, p90: 75, p95: 85 },
  },
  {
    id: 'calf',
    label: 'Mollets',
    muscleGroup: 'legs',
    patterns: [/calf/i],
    percentiles: { p10: 40, p25: 60, p50: 90, p75: 120, p90: 150, p95: 180 },
  },
]

const MUSCLE_FALLBACK_BENCHMARKS: Record<
  string,
  StrengthBenchmark['percentiles']
> = {
  chest: { p10: 35, p25: 50, p50: 70, p75: 90, p90: 105, p95: 120 },
  back: { p10: 45, p25: 65, p50: 90, p75: 115, p90: 140, p95: 160 },
  shoulders: { p10: 20, p25: 30, p50: 45, p75: 58, p90: 70, p95: 80 },
  biceps: { p10: 10, p25: 16, p50: 25, p75: 35, p90: 45, p95: 52 },
  triceps: { p10: 12, p25: 18, p50: 28, p75: 38, p90: 48, p95: 55 },
  legs: { p10: 45, p25: 65, p50: 95, p75: 125, p90: 155, p95: 175 },
  glutes: { p10: 35, p25: 55, p50: 80, p75: 105, p90: 130, p95: 150 },
  abs: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, p95: 0 },
  full_body: { p10: 40, p25: 60, p50: 85, p75: 110, p90: 135, p95: 155 },
  cardio: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, p95: 0 },
}

export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 1) {
    return weightKg
  }

  return Math.round(weightKg * (1 + reps / 30) * 10) / 10
}

export function findStrengthBenchmark(exerciseName: string): StrengthBenchmark | null {
  for (const benchmark of STRENGTH_BENCHMARKS) {
    if (benchmark.patterns.some((pattern) => pattern.test(exerciseName))) {
      return benchmark
    }
  }

  return null
}

function interpolatePercentile(
  oneRm: number,
  thresholds: StrengthBenchmark['percentiles'],
): number {
  const points: Array<[number, number]> = [
    [thresholds.p10, 10],
    [thresholds.p25, 25],
    [thresholds.p50, 50],
    [thresholds.p75, 75],
    [thresholds.p90, 90],
    [thresholds.p95, 95],
  ]

  if (oneRm <= points[0][0]) {
    return Math.max(1, Math.round((oneRm / points[0][0]) * 10))
  }

  if (oneRm >= points[points.length - 1][0]) {
    const top = points[points.length - 1][0]
    return Math.min(99, 95 + Math.round(((oneRm - top) / top) * 4))
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const [lowWeight, lowPct] = points[index]
    const [highWeight, highPct] = points[index + 1]

    if (oneRm >= lowWeight && oneRm <= highWeight) {
      const ratio = (oneRm - lowWeight) / (highWeight - lowWeight)
      return Math.round(lowPct + ratio * (highPct - lowPct))
    }
  }

  return 50
}

export type StrengthPercentileResult = {
  oneRmKg: number
  percentile: number
  tierLabel: string
  benchmarkLabel: string
  isEstimated: boolean
}

export function getStrengthPercentile(
  exerciseName: string,
  muscleGroup: string,
  bestWeightKg: number,
  bestReps: number,
): StrengthPercentileResult | null {
  if (bestWeightKg <= 0 || bestReps <= 0) {
    return null
  }

  const oneRmKg = estimateOneRepMax(bestWeightKg, bestReps)
  const benchmark = findStrengthBenchmark(exerciseName)
  const thresholds =
    benchmark?.percentiles ??
    MUSCLE_FALLBACK_BENCHMARKS[muscleGroup] ??
    MUSCLE_FALLBACK_BENCHMARKS.full_body

  if (thresholds.p50 <= 0) {
    return null
  }

  const percentile = interpolatePercentile(oneRmKg, thresholds)

  let tierLabel: string
  if (percentile >= 90) {
    tierLabel = `Top ${Math.max(1, 100 - percentile)}%`
  } else if (percentile >= 75) {
    tierLabel = 'Au-dessus de la moyenne'
  } else if (percentile >= 50) {
    tierLabel = 'Dans la moyenne'
  } else if (percentile >= 25) {
    tierLabel = 'En progression'
  } else {
    tierLabel = 'Débutant / en construction'
  }

  return {
    oneRmKg,
    percentile,
    tierLabel,
    benchmarkLabel: benchmark?.label ?? `Repere ${muscleGroup}`,
    isEstimated: benchmark == null,
  }
}

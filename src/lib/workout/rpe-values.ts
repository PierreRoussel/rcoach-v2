export const RPE_VALUES = [
  6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10,
] as const

export type RpeValue = (typeof RPE_VALUES)[number]

export const DEFAULT_RPE_VALUE: RpeValue = 8

export function isRpeValue(value: number | null | undefined): value is RpeValue {
  return value != null && RPE_VALUES.some((entry) => entry === value)
}

export function formatRpeDisplay(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/** Reps in reserve (RIR) ≈ 10 − RPE. */
export function getRpeRepsInReserve(rpe: RpeValue): number {
  return Math.round((10 - rpe) * 10) / 10
}

export function formatRpeRepsInReserveHint(rpe: RpeValue): string {
  const repsInReserve = getRpeRepsInReserve(rpe)

  if (repsInReserve === 0) {
    return 'Échec — 0 répétition restante'
  }

  if (repsInReserve === 0.5) {
    return 'Moins d’1 répétition restante'
  }

  if (Number.isInteger(repsInReserve)) {
    return repsInReserve === 1
      ? '1 répétition restante'
      : `${repsInReserve} répétitions restantes`
  }

  return `${formatRpeDisplay(repsInReserve)} répétitions restantes`
}

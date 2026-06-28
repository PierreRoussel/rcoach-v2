export const WAIST_MIN_CM = 50
export const WAIST_MAX_CM = 180
export const WAIST_STEP_CM = 0.5
export const WAIST_CHANGE_THRESHOLD_CM = 0.05

export function clampWaistCm(value: number) {
  const stepped = Math.round(value / WAIST_STEP_CM) * WAIST_STEP_CM
  return Math.max(WAIST_MIN_CM, Math.min(WAIST_MAX_CM, Math.round(stepped * 10) / 10))
}

export function buildWaistCmOptions() {
  const options: number[] = []

  for (
    let value = WAIST_MIN_CM;
    value <= WAIST_MAX_CM + WAIST_STEP_CM / 2;
    value += WAIST_STEP_CM
  ) {
    options.push(Math.round(value * 10) / 10)
  }

  return options
}

export function formatWaistCm(value: number) {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded)
    ? `${rounded}`
    : rounded.toFixed(1).replace('.', ',')
}

export function formatWaistCmWithUnit(value: number) {
  return `${formatWaistCm(value)} cm`
}

export function nearestWaistOption(value: number, options = buildWaistCmOptions()) {
  const clamped = clampWaistCm(value)
  let nearest = options[0] ?? WAIST_MIN_CM
  let smallestDelta = Number.POSITIVE_INFINITY

  for (const option of options) {
    const delta = Math.abs(option - clamped)
    if (delta < smallestDelta) {
      smallestDelta = delta
      nearest = option
    }
  }

  return nearest
}

export function hasWaistChanged(previous: number | null | undefined, next: number) {
  if (previous == null || !Number.isFinite(previous)) {
    return true
  }

  return Math.abs(previous - next) >= WAIST_CHANGE_THRESHOLD_CM
}

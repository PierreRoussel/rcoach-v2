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

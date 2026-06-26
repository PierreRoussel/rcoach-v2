export function parsePortionGramsInput(value: string): number {
  const trimmed = value.trim()
  if (trimmed === '') {
    return 0
  }

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.max(0, Math.round(parsed * 100) / 100)
}

export function normalizeProposedFoodName(value: string): string {
  return value.trim()
}

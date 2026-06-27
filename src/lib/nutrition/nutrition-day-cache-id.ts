export function nutritionDayCacheId(userId: string, date: string) {
  return `${userId}:${date}`
}

export function nutritionDayQueryKey(userId: string | undefined, date: string) {
  return ['nutrition-day', userId, date] as const
}

export function nutritionHintsRangeQueryKey(
  userId: string | undefined,
  from: string,
  to: string,
) {
  return ['nutrition-hints-range', userId, from, to] as const
}

export function nutritionHintsQueryKey(userId: string | undefined, anchorDate: string) {
  return ['nutrition-hints', userId, anchorDate] as const
}

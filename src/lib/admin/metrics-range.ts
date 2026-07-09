export type AdminMetricsRange = '7d' | '30d' | '90d' | '12m'

export type AdminMetricsDateRange = {
  from: string
  to: string
  cohortWeeks: number
}

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function resolveAdminMetricsDateRange(
  range: AdminMetricsRange,
  now = new Date(),
): AdminMetricsDateRange {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start = new Date(end)

  switch (range) {
    case '7d':
      start.setDate(start.getDate() - 6)
      return { from: toDateKey(start), to: toDateKey(end), cohortWeeks: 4 }
    case '90d':
      start.setDate(start.getDate() - 89)
      return { from: toDateKey(start), to: toDateKey(end), cohortWeeks: 12 }
    case '12m':
      start.setFullYear(start.getFullYear() - 1)
      start.setDate(start.getDate() + 1)
      return { from: toDateKey(start), to: toDateKey(end), cohortWeeks: 24 }
    case '30d':
    default:
      start.setDate(start.getDate() - 29)
      return { from: toDateKey(start), to: toDateKey(end), cohortWeeks: 8 }
  }
}

export function computeRollingActiveUsers(
  dailyCounts: Array<{ date: string; dau: number }>,
  windowDays: number,
): Array<{ date: string; value: number }> {
  if (windowDays <= 1) {
    return dailyCounts.map((entry) => ({ date: entry.date, value: entry.dau }))
  }

  return dailyCounts.map((entry, index) => {
    const startIndex = Math.max(0, index - windowDays + 1)
    const slice = dailyCounts.slice(startIndex, index + 1)
    const value = slice.reduce((sum, item) => sum + item.dau, 0)

    return { date: entry.date, value }
  })
}

export function formatCentsToEuros(cents: number): string {
  const euros = cents / 100
  return euros % 1 === 0 ? `${euros} €` : `${euros.toFixed(2).replace('.', ',')} €`
}

export function funnelStepRate(current: number, previous: number): number {
  if (previous <= 0) {
    return 0
  }

  return Math.round((current / previous) * 1000) / 10
}

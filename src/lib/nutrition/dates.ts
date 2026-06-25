export function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(dateKey: string, days: number) {
  const date = parseDateKey(dateKey)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

export function formatFrenchDateLabel(dateKey: string) {
  const date = parseDateKey(dateKey)
  const today = toDateKey(new Date())
  const yesterday = addDays(today, -1)
  const tomorrow = addDays(today, 1)

  if (dateKey === today) {
    return "Aujourd'hui"
  }
  if (dateKey === yesterday) {
    return 'Hier'
  }
  if (dateKey === tomorrow) {
    return 'Demain'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

export function buildDateWindow(centerDateKey: string, radius = 14) {
  const dates: string[] = []
  for (let offset = -radius; offset <= radius; offset += 1) {
    dates.push(addDays(centerDateKey, offset))
  }
  return dates
}

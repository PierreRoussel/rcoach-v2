type TimeOfDay = 'matin' | 'apres-midi' | 'soir'

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour < 12) {
    return 'matin'
  }

  if (hour < 18) {
    return 'apres-midi'
  }

  return 'soir'
}

function daysSince(dateStr: string, now: Date): number {
  const date = new Date(dateStr)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffMs = startOfToday.getTime() - startOfDate.getTime()

  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function formatTimeOfDayLabel(timeOfDay: TimeOfDay): string {
  if (timeOfDay === 'apres-midi') {
    return 'après-midi'
  }

  return timeOfDay
}

function formatTimeOfDayPhrase(timeOfDay: TimeOfDay, dayOffset: 0 | 1): string {
  const label = formatTimeOfDayLabel(timeOfDay)

  if (dayOffset === 1) {
    return `hier ${label}`
  }

  if (timeOfDay === 'apres-midi') {
    return 'cet après-midi'
  }

  return `ce ${label}`
}

export function formatValidatedWorkoutMessage(
  title: string,
  startedAt: string,
  now = new Date(),
): string {
  const sessionTitle = title.trim() || 'Séance'
  const started = new Date(startedAt)
  const days = daysSince(startedAt, now)
  const timeOfDay = getTimeOfDay(started.getHours())
  const validated = sessionTitle === 'Séance' ? 'validée' : 'validé'

  if (days === 0) {
    return `${sessionTitle} ${validated} ${formatTimeOfDayPhrase(timeOfDay, 0)} !`
  }

  if (days === 1) {
    return `${sessionTitle} ${validated} ${formatTimeOfDayPhrase(timeOfDay, 1)} !`
  }

  if (days === 2) {
    return `${sessionTitle} ${validated} avant-hier !`
  }

  return `${sessionTitle} ${validated} il y a ${days} jours`
}

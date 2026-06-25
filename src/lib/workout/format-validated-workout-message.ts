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

function formatTimeOfDayPhrase(timeOfDay: TimeOfDay, dayOffset: 0 | 1): string {
  if (dayOffset === 1) {
    return `hier ${timeOfDay}`
  }

  if (timeOfDay === 'apres-midi') {
    return 'cet apres-midi'
  }

  return `ce ${timeOfDay}`
}

export function formatValidatedWorkoutMessage(
  title: string,
  startedAt: string,
  now = new Date(),
): string {
  const sessionTitle = title.trim() || 'Seance'
  const started = new Date(startedAt)
  const days = daysSince(startedAt, now)
  const timeOfDay = getTimeOfDay(started.getHours())

  if (days === 0) {
    return `${sessionTitle} valide ${formatTimeOfDayPhrase(timeOfDay, 0)} !`
  }

  if (days === 1) {
    return `${sessionTitle} valide ${formatTimeOfDayPhrase(timeOfDay, 1)} !`
  }

  if (days === 2) {
    return `${sessionTitle} valide avant-hier !`
  }

  return `${sessionTitle} valide il y a ${days} jours`
}

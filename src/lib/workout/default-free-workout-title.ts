type TimeOfDaySlot = {
  title: string
  emoji: string
}

function resolveTimeOfDaySlot(hour: number): TimeOfDaySlot {
  if (hour >= 5 && hour < 12) {
    return { title: 'Séance du matin', emoji: '☀️' }
  }

  if (hour >= 12 && hour < 18) {
    return { title: "Séance de l'après-midi", emoji: '🌤️' }
  }

  if (hour >= 18 && hour < 23) {
    return { title: 'Séance du soir', emoji: '🌙' }
  }

  return { title: 'Séance de nuit', emoji: '🌙' }
}

export function getDefaultFreeWorkoutTitle(date = new Date()): string {
  const { title, emoji } = resolveTimeOfDaySlot(date.getHours())
  return `${title} ${emoji}`
}

export function isLegacyFreeWorkoutTitle(title: string): boolean {
  const trimmed = title.trim().toLowerCase()
  return trimmed === 'séance libre' || trimmed === 'seance libre'
}

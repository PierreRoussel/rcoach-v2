import { differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'

function parseDateOnly(value: string): Date {
  return startOfDay(parseISO(value.length === 10 ? `${value}T12:00:00` : value))
}

export function formatRelativeScheduleDate(
  date: string | Date,
  now = new Date(),
): string {
  const target =
    typeof date === 'string' ? parseDateOnly(date) : startOfDay(date)
  const today = startOfDay(now)
  const days = differenceInCalendarDays(target, today)

  if (days === 0) {
    return "Aujourd'hui"
  }

  if (days === 1) {
    return 'Demain'
  }

  if (days > 1 && days < 7) {
    return `Dans ${days} jours`
  }

  return format(target, 'd MMM', { locale: fr })
}

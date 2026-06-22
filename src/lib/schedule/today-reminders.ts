import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

import {
  getTodayOccurrences,
  type ScheduledSession,
  type ScheduleOccurrence,
} from '@/lib/schedule/expand-occurrences'

export type TodayReminder = ScheduleOccurrence & {
  timeLabel: string | null
}

function formatTimeLabel(timeLocal: string | null): string | null {
  if (!timeLocal) {
    return null
  }

  const [hours, minutes] = timeLocal.split(':')
  if (!hours || !minutes) {
    return null
  }

  return `${hours}h${minutes}`
}

export function getTodayReminders(
  sessions: ScheduledSession[],
  now = new Date(),
): TodayReminder[] {
  return getTodayOccurrences(sessions, now).map((occurrence) => ({
    ...occurrence,
    timeLabel: formatTimeLabel(occurrence.timeLocal),
  }))
}

export function formatTodayReminderMessage(reminders: TodayReminder[]): string | null {
  if (reminders.length === 0) {
    return null
  }

  if (reminders.length === 1) {
    const reminder = reminders[0]
    const time = reminder.timeLabel ? ` a ${reminder.timeLabel}` : ''
    return `Seance prevue${time} : ${reminder.title}`
  }

  return `${reminders.length} seances prevues aujourd'hui`
}

export function formatTodayDateLabel(now = new Date()): string {
  return format(now, "EEEE d MMMM", { locale: fr })
}

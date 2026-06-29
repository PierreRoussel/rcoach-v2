import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

import {
  getTodayOccurrences,
  type ScheduledSession,
  type ScheduleOccurrence,
} from '@/lib/schedule/expand-occurrences'
import { hadCompletedWorkoutOnDay } from '@/lib/schedule/missed-occurrences'

export type TodayReminder = ScheduleOccurrence & {
  timeLabel: string | null
}

type CompletedWorkoutDayCheck = {
  started_at: string
  ended_at: string | null
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
  completedWorkouts: CompletedWorkoutDayCheck[] = [],
): TodayReminder[] {
  if (hadCompletedWorkoutOnDay(completedWorkouts, now)) {
    return []
  }

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
    return `Séance prévue${time} : ${reminder.title}`
  }

  return `${reminders.length} séances prévues aujourd'hui`
}

export function formatTodayDateLabel(now = new Date()): string {
  return format(now, "EEEE d MMMM", { locale: fr })
}

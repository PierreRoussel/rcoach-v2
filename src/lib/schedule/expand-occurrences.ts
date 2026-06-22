import {
  eachDayOfInterval,
  format,
  getISODay,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
} from 'date-fns'

export type ScheduledSession = {
  id: string
  title: string
  workout_template_id: string | null
  recurrence_type: 'once' | 'weekly'
  weekdays: number[] | null
  scheduled_date: string | null
  time_local: string | null
  start_date: string
  end_date: string | null
  is_active: boolean
  workout_template?: { id: string; name: string } | null
}

export type ScheduleOccurrence = {
  date: string
  sessionId: string
  title: string
  workoutTemplateId: string | null
  workoutTemplateName: string | null
  timeLocal: string | null
}

function parseDateOnly(value: string): Date {
  return startOfDay(parseISO(value.length === 10 ? `${value}T12:00:00` : value))
}

function isWithinRuleBounds(date: Date, session: ScheduledSession): boolean {
  const start = parseDateOnly(session.start_date)
  if (isBefore(date, start)) {
    return false
  }

  if (session.end_date) {
    const end = parseDateOnly(session.end_date)
    if (isAfter(date, end)) {
      return false
    }
  }

  return true
}

export function expandSessionOccurrences(
  session: ScheduledSession,
  rangeStart: Date,
  rangeEnd: Date,
): ScheduleOccurrence[] {
  if (!session.is_active) {
    return []
  }

  const occurrences: ScheduleOccurrence[] = []
  const templateName = session.workout_template?.name ?? null

  if (session.recurrence_type === 'once' && session.scheduled_date) {
    const date = parseDateOnly(session.scheduled_date)
    if (
      !isBefore(date, startOfDay(rangeStart)) &&
      !isAfter(date, startOfDay(rangeEnd)) &&
      isWithinRuleBounds(date, session)
    ) {
      occurrences.push({
        date: format(date, 'yyyy-MM-dd'),
        sessionId: session.id,
        title: session.title || templateName || 'Seance planifiee',
        workoutTemplateId: session.workout_template_id,
        workoutTemplateName: templateName,
        timeLocal: session.time_local,
      })
    }

    return occurrences
  }

  if (session.recurrence_type === 'weekly' && session.weekdays?.length) {
    const weekdaySet = new Set(session.weekdays)

    for (const day of eachDayOfInterval({
      start: startOfDay(rangeStart),
      end: startOfDay(rangeEnd),
    })) {
      if (!weekdaySet.has(getISODay(day)) || !isWithinRuleBounds(day, session)) {
        continue
      }

      occurrences.push({
        date: format(day, 'yyyy-MM-dd'),
        sessionId: session.id,
        title: session.title || templateName || 'Seance planifiee',
        workoutTemplateId: session.workout_template_id,
        workoutTemplateName: templateName,
        timeLocal: session.time_local,
      })
    }
  }

  return occurrences
}

export function expandAllOccurrences(
  sessions: ScheduledSession[],
  rangeStart: Date,
  rangeEnd: Date,
): ScheduleOccurrence[] {
  const byKey = new Map<string, ScheduleOccurrence>()

  for (const session of sessions) {
    for (const occurrence of expandSessionOccurrences(session, rangeStart, rangeEnd)) {
      const key = `${occurrence.date}:${occurrence.sessionId}`
      byKey.set(key, occurrence)
    }
  }

  return [...byKey.values()].sort((left, right) =>
    left.date.localeCompare(right.date),
  )
}

export function getOccurrencesForDate(
  sessions: ScheduledSession[],
  date: Date,
): ScheduleOccurrence[] {
  const day = startOfDay(date)
  return expandAllOccurrences(sessions, day, day)
}

export function getTodayOccurrences(
  sessions: ScheduledSession[],
  now = new Date(),
): ScheduleOccurrence[] {
  return getOccurrencesForDate(sessions, now)
}

export function datesMatchWorkoutDay(workoutStartedAt: string, date: Date): boolean {
  return isSameDay(parseISO(workoutStartedAt), date)
}

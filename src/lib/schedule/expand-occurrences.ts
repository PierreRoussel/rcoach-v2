import {
  addYears,
  eachDayOfInterval,
  format,
  getISODay,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
} from 'date-fns'

export type ScheduleRecurrenceType = 'once' | 'weekly' | 'aba'

export type ScheduledSession = {
  id: string
  title: string
  workout_template_id: string | null
  workout_template_id_b?: string | null
  recurrence_type: ScheduleRecurrenceType
  weekdays: number[] | null
  scheduled_date: string | null
  time_local: string | null
  start_date: string
  end_date: string | null
  is_active: boolean
  workout_template?: { id: string; name: string } | null
  workout_template_b?: { id: string; name: string } | null
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

function matchesWeekdays(day: Date, weekdays: number[]): boolean {
  return weekdays.includes(getISODay(day))
}

/** 1-based occurrence index from start_date through `date` (inclusive). */
export function countSessionOccurrencesUpTo(
  session: Pick<ScheduledSession, 'start_date' | 'end_date' | 'weekdays'>,
  date: Date,
): number {
  const weekdays = session.weekdays ?? []
  if (weekdays.length === 0) {
    return 0
  }

  const start = parseDateOnly(session.start_date)
  const end = startOfDay(date)

  if (isBefore(end, start)) {
    return 0
  }

  let count = 0

  for (const day of eachDayOfInterval({ start, end })) {
    if (!matchesWeekdays(day, weekdays) || !isWithinRuleBounds(day, session)) {
      continue
    }

    count++
  }

  return count
}

function resolveAlternatingTemplate(
  session: ScheduledSession,
  occurrenceIndex: number,
): { templateId: string | null; templateName: string | null } {
  const useTemplateA = occurrenceIndex % 2 === 1

  if (useTemplateA) {
    return {
      templateId: session.workout_template_id,
      templateName: session.workout_template?.name ?? null,
    }
  }

  return {
    templateId: session.workout_template_id_b ?? null,
    templateName: session.workout_template_b?.name ?? null,
  }
}

function expandRecurringOccurrences(
  session: ScheduledSession,
  rangeStart: Date,
  rangeEnd: Date,
  resolveTemplate: (
    session: ScheduledSession,
    occurrenceIndex: number,
  ) => { templateId: string | null; templateName: string | null },
): ScheduleOccurrence[] {
  const weekdays = session.weekdays ?? []
  if (weekdays.length === 0) {
    return []
  }

  const weekdaySet = new Set(weekdays)
  const occurrences: ScheduleOccurrence[] = []

  for (const day of eachDayOfInterval({
    start: startOfDay(rangeStart),
    end: startOfDay(rangeEnd),
  })) {
    if (!weekdaySet.has(getISODay(day)) || !isWithinRuleBounds(day, session)) {
      continue
    }

    const occurrenceIndex = countSessionOccurrencesUpTo(session, day)
    const { templateId, templateName } = resolveTemplate(session, occurrenceIndex)
    const fallbackTitle = session.title || 'Séance planifiée'

    occurrences.push({
      date: format(day, 'yyyy-MM-dd'),
      sessionId: session.id,
      title: templateName || fallbackTitle,
      workoutTemplateId: templateId,
      workoutTemplateName: templateName,
      timeLocal: session.time_local,
    })
  }

  return occurrences
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
        title: session.title || templateName || 'Séance planifiée',
        workoutTemplateId: session.workout_template_id,
        workoutTemplateName: templateName,
        timeLocal: session.time_local,
      })
    }

    return occurrences
  }

  if (session.recurrence_type === 'weekly' && session.weekdays?.length) {
    return expandRecurringOccurrences(session, rangeStart, rangeEnd, () => ({
      templateId: session.workout_template_id,
      templateName: session.workout_template?.name ?? null,
    }))
  }

  if (session.recurrence_type === 'aba' && session.weekdays?.length) {
    return expandRecurringOccurrences(
      session,
      rangeStart,
      rangeEnd,
      resolveAlternatingTemplate,
    )
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

export function buildNextOccurrenceByTemplateId(
  sessions: ScheduledSession[],
  now = new Date(),
): Map<string, string> {
  const today = startOfDay(now)
  const rangeEnd = addYears(today, 2)
  const occurrences = expandAllOccurrences(sessions, today, rangeEnd)
  const byTemplateId = new Map<string, string>()

  for (const occurrence of occurrences) {
    if (
      occurrence.workoutTemplateId &&
      !byTemplateId.has(occurrence.workoutTemplateId)
    ) {
      byTemplateId.set(occurrence.workoutTemplateId, occurrence.date)
    }
  }

  return byTemplateId
}

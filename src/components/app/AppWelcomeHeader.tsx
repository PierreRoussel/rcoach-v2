import { Link } from '@tanstack/react-router'

import { BrandLogo } from '@/design-system'
import { useCalendarData } from '@/hooks/useCalendarData'
import { useActiveWorkoutElapsed } from '@/hooks/useActiveWorkoutElapsed'
import { useStartPlannedSession } from '@/hooks/useStartPlannedSession'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { formatTodayReminderMessage } from '@/lib/schedule/today-reminders'
import { getWorkoutEncouragementMessage } from '@/lib/workout/workout-encouragement'

function getFirstName(displayName: string | null | undefined): string | null {
  if (!displayName?.trim()) {
    return null
  }

  const trimmed = displayName.trim()
  const spaceIndex = trimmed.indexOf(' ')
  return spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex)
}

function daysSince(dateStr: string): number {
  const date = new Date(dateStr)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffMs = startOfToday.getTime() - startOfDate.getTime()

  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function formatLastSessionMessage(startedAt: string): string {
  const days = daysSince(startedAt)

  if (days === 0) {
    return 'Derniere seance aujourd\'hui'
  }

  if (days === 1) {
    return 'Derniere seance il y a 1 jour'
  }

  return `Derniere seance il y a ${days} jours`
}

type AppWelcomeHeaderProps = {
  displayName?: string | null
}

export function AppWelcomeHeader({ displayName }: AppWelcomeHeaderProps) {
  const startedAt = useActiveWorkoutStore((state) => state.startedAt)
  const workoutTitle = useActiveWorkoutStore((state) => state.title)
  const exercises = useActiveWorkoutStore((state) => state.exercises)
  const lastCompletedStep = useActiveWorkoutStore((state) => state.lastCompletedStep)
  const elapsed = useActiveWorkoutElapsed(startedAt)
  const { workouts, todayReminders } = useCalendarData()
  const { startPlannedSession, isStarting } = useStartPlannedSession()

  const firstName = getFirstName(displayName)
  const greeting = firstName ? `Bonjour ${firstName} 👋` : 'Bonjour 👋'
  const encouragement = startedAt
    ? getWorkoutEncouragementMessage(exercises, lastCompletedStep)
    : null

  const mostRecentWorkout = workouts[0]
  const todayMessage = formatTodayReminderMessage(todayReminders)
  const primaryReminder = todayReminders[0]

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <BrandLogo compact />
      <div className="min-w-0 flex-1">
        {startedAt ? (
          <>
            <p className="truncate font-display text-sm font-black text-foreground">
              <Link
                to="/app/workout/active"
                className="hover:text-primary"
              >
                {workoutTitle.trim() || 'Seance en cours'}
              </Link>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {elapsed}
              {encouragement ? ` · ${encouragement}` : null}
            </p>
          </>
        ) : (
          <>
            <p className="truncate font-display text-sm font-black text-foreground">
              {greeting}
            </p>
            {todayMessage && primaryReminder ? (
              <p className="truncate text-xs text-muted-foreground">
                {todayMessage} —{' '}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  disabled={isStarting}
                  onClick={() => void startPlannedSession(primaryReminder)}
                >
                  Demarrer
                </button>
                {' · '}
                <Link
                  to="/app/planning"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Planning
                </Link>
              </p>
            ) : mostRecentWorkout ? (
              <p className="truncate text-xs text-muted-foreground">
                {formatLastSessionMessage(mostRecentWorkout.started_at)}
              </p>
            ) : (
              <p className="truncate text-xs text-muted-foreground">
                Pret pour votre premiere seance ?
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

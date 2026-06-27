import { Link } from '@tanstack/react-router'

import { BrandLogo } from '@/design-system'
import { useExerciseLocale } from '@/hooks/useExerciseLocale'
import { useTodayReminders } from '@/hooks/useScheduledSessions'
import { useMyLastCompletedWorkout } from '@/hooks/useWorkouts'
import { useActiveWorkoutElapsed } from '@/hooks/useActiveWorkoutElapsed'
import { useStartPlannedSession } from '@/hooks/useStartPlannedSession'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { formatTodayReminderMessage } from '@/lib/schedule/today-reminders'
import { formatValidatedWorkoutMessage } from '@/lib/workout/format-validated-workout-message'
import { getWorkoutEncouragementMessage } from '@/lib/workout/workout-encouragement'

function getFirstName(displayName: string | null | undefined): string | null {
  if (!displayName?.trim()) {
    return null
  }

  const trimmed = displayName.trim()
  const spaceIndex = trimmed.indexOf(' ')
  return spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex)
}

type AppWelcomeHeaderProps = {
  displayName?: string | null
}

export function AppWelcomeHeader({ displayName }: AppWelcomeHeaderProps) {
  const startedAt = useActiveWorkoutStore((state) => state.startedAt)
  const workoutTitle = useActiveWorkoutStore((state) => state.title)
  const elapsed = useActiveWorkoutElapsed(startedAt)
  const { data: lastCompletedWorkout } = useMyLastCompletedWorkout()
  const { todayReminders } = useTodayReminders()
  const { startPlannedSession, isStarting } = useStartPlannedSession()

  const firstName = getFirstName(displayName)
  const greeting = firstName ? `Bonjour ${firstName} 👋` : 'Bonjour 👋'
  const exerciseLocale = useExerciseLocale()
  const encouragement = useActiveWorkoutStore((state) => {
    if (!state.startedAt) {
      return null
    }

    return getWorkoutEncouragementMessage(
      state.exercises,
      state.lastCompletedStep,
      exerciseLocale,
    )
  })

  const mostRecentWorkout = lastCompletedWorkout
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
                {workoutTitle.trim() || 'Séance en cours'}
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
                  Démarrer
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
                {formatValidatedWorkoutMessage(
                  mostRecentWorkout.title,
                  mostRecentWorkout.started_at,
                )}
              </p>
            ) : (
              <p className="truncate text-xs text-muted-foreground">
                Prêt pour votre première séance ?
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

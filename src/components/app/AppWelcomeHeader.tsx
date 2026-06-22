import { Link } from '@tanstack/react-router'

import { BrandLogo } from '@/design-system'
import { useMyWorkouts } from '@/hooks/useWorkouts'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'

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
  const { data: workouts } = useMyWorkouts()

  const firstName = getFirstName(displayName)
  const greeting = firstName ? `Bonjour ${firstName} 👋` : 'Bonjour 👋'

  const mostRecentWorkout = workouts?.[0]

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <BrandLogo compact />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-black text-foreground">
          {greeting}
        </p>
        {startedAt ? (
          <p className="truncate text-xs text-muted-foreground">
            Seance en cours —{' '}
            <Link
              to="/app/workout/active"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Reprendre
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
      </div>
    </div>
  )
}

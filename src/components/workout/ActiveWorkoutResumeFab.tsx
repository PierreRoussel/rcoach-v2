import { Link, useRouterState } from '@tanstack/react-router'
import { Play } from 'lucide-react'

import { useActiveWorkoutElapsed } from '@/hooks/useActiveWorkoutElapsed'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { WORKOUT_FAB_BOTTOM_OFFSET } from '@/lib/workout/fab-layout'
import { cn } from '@/lib/utils'

export function ActiveWorkoutResumeFab() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const startedAt = useActiveWorkoutStore((state) => state.startedAt)
  const title = useActiveWorkoutStore((state) => state.title)
  const elapsed = useActiveWorkoutElapsed(startedAt)

  const isOnActiveWorkoutPage = pathname.startsWith('/app/workout/active')

  if (!startedAt || isOnActiveWorkoutPage) {
    return null
  }

  const sessionLabel = title.trim() || 'Séance en cours'

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 px-4"
      style={{ bottom: WORKOUT_FAB_BOTTOM_OFFSET }}
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg justify-center">
        <Link
          to="/app/workout/active"
          aria-label={`Reprendre ${sessionLabel}`}
          className={cn(
            'group relative flex min-w-[min(100%,17.5rem)] max-w-full items-center gap-3 overflow-hidden rounded-full',
            'border border-primary-foreground/20 bg-primary px-4 py-2.5 text-primary-foreground',
            'shadow-soft-primary transition-transform hover:scale-[1.02] active:scale-[0.98]',
          )}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/10"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-2 -z-10 animate-motivation-pulse rounded-full bg-primary/35 blur-xl"
          />

          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 ring-2 ring-primary-foreground/25">
            <Play className="size-4 fill-current" />
          </span>

          <span className="relative min-w-0 flex-1 text-left">
            <span className="block font-display text-sm font-black leading-tight">
              Reprendre
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-medium text-primary-foreground/85">
              {sessionLabel}
              {elapsed ? (
                <>
                  {' '}
                  · <span className="tabular-nums">{elapsed}</span>
                </>
              ) : null}
            </span>
          </span>
        </Link>
      </div>
    </div>
  )
}

import { CircleCheckBig } from 'lucide-react'

import { cn } from '@/lib/utils'
import { WORKOUT_FAB_BOTTOM_OFFSET } from '@/lib/workout/fab-layout'

type ActiveWorkoutFinishFabProps = {
  disabled?: boolean
  onFinish: () => void
}

export function ActiveWorkoutFinishFab({
  disabled = false,
  onFinish,
}: ActiveWorkoutFinishFabProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 px-4"
      style={{ bottom: WORKOUT_FAB_BOTTOM_OFFSET }}
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg justify-center">
        <button
          type="button"
          disabled={disabled}
          aria-label="Terminer la séance"
          onClick={onFinish}
          className={cn(
            'group relative flex min-w-[min(100%,17.5rem)] max-w-full items-center gap-3 overflow-hidden rounded-full',
            'border border-secondary-foreground/20 bg-secondary px-4 py-2.5 text-secondary-foreground',
            'shadow-[0_12px_30px_rgba(133,201,174,0.22)] transition-transform',
            'hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
          )}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/10"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-2 -z-10 animate-motivation-pulse rounded-full bg-secondary/35 blur-xl"
          />

          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-foreground/10 ring-2 ring-secondary-foreground/20">
            <CircleCheckBig className="size-4" />
          </span>

          <span className="relative min-w-0 flex-1 text-left">
            <span className="block font-display text-sm font-black leading-tight">
              Terminer la séance
            </span>
            <span className="mt-0.5 block text-[11px] font-medium text-secondary-foreground/85">
              Toutes les séries sont validées
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}

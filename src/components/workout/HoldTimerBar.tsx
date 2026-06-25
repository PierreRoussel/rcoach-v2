import { Square } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type HoldTimerBarProps = {
  holdSecondsLeft: number
  holdTargetSeconds: number
  exerciseLabel: string | null
  onStop: () => void
  className?: string
}

export function HoldTimerBar({
  holdSecondsLeft,
  holdTargetSeconds,
  exerciseLabel,
  onStop,
  className,
}: HoldTimerBarProps) {
  const progress =
    holdTargetSeconds > 0
      ? Math.min(100, ((holdTargetSeconds - holdSecondsLeft) / holdTargetSeconds) * 100)
      : 100

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-16 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur',
        className,
      )}
    >
      <div className="mx-auto max-w-lg space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-sm font-black text-foreground">Maintien</p>
            {exerciseLabel ? (
              <p className="truncate text-xs text-muted-foreground">{exerciseLabel}</p>
            ) : null}
          </div>
          <p className="font-data text-3xl font-black tabular-nums text-primary">
            {holdSecondsLeft}s
          </p>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Button
          type="button"
          variant="pill"
          size="sm"
          className="w-full rounded-full"
          onClick={onStop}
        >
          <Square className="size-3.5" />
          Stop
        </Button>
      </div>
    </div>
  )
}

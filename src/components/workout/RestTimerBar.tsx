import { Minus, Plus, SkipForward } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type RestTimerBarProps = {
  restSecondsLeft: number
  restTargetSeconds: number
  nextStepLabel: string | null
  onAdjust: (deltaSeconds: number) => void
  onSkip: () => void
  className?: string
}

export function RestTimerBar({
  restSecondsLeft,
  restTargetSeconds,
  nextStepLabel,
  onAdjust,
  onSkip,
  className,
}: RestTimerBarProps) {
  const progress =
    restTargetSeconds > 0
      ? Math.min(100, ((restTargetSeconds - restSecondsLeft) / restTargetSeconds) * 100)
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
            <p className="font-display text-sm font-black text-foreground">Repos</p>
            {nextStepLabel ? (
              <p className="truncate text-xs text-muted-foreground">
                Prochaine : {nextStepLabel}
              </p>
            ) : null}
          </div>
          <p className="font-data text-3xl font-black tabular-nums text-primary">
            {restSecondsLeft}s
          </p>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => onAdjust(-15)}
          >
            <Minus className="size-3.5" />
            15s
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => onAdjust(15)}
          >
            <Plus className="size-3.5" />
            15s
          </Button>
          <Button
            type="button"
            variant="pill"
            size="sm"
            className="rounded-full"
            onClick={onSkip}
          >
            <SkipForward className="size-3.5" />
            Passer
          </Button>
        </div>
      </div>
    </div>
  )
}

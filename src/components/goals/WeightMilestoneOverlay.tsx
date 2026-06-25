import { useEffect } from 'react'
import { Flame, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type WeightMilestoneOverlayProps = {
  open: boolean
  milestoneCount: number
  goalLabel: string
  onClose: () => void
}

export function WeightMilestoneOverlay({
  open,
  milestoneCount,
  goalLabel,
  onClose,
}: WeightMilestoneOverlayProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const timer = window.setTimeout(() => {
      onClose()
    }, 3200)

    return () => window.clearTimeout(timer)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Palier atteint"
    >
      <div className="relative w-full max-w-sm rounded-3xl border border-orange-500/30 bg-gradient-to-b from-orange-950/90 to-background p-8 text-center shadow-2xl">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 rounded-full text-muted-foreground"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X className="size-4" />
        </Button>

        <div className="relative mx-auto mb-4 flex size-28 items-center justify-center">
          <span className="absolute inset-0 animate-weight-flame-ring rounded-full bg-orange-500/20" />
          <span className="absolute inset-2 animate-weight-flame-ring-delay rounded-full bg-orange-400/25" />
          <Flame className="relative size-16 animate-weight-flame-bounce text-orange-400" />
          <Flame className="absolute -left-2 top-6 size-8 animate-weight-flame-left text-orange-300/80" />
          <Flame className="absolute -right-2 top-8 size-7 animate-weight-flame-right text-orange-300/80" />
        </div>

        <p className="font-display text-2xl font-black text-orange-300">
          Palier de 500 g !
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {milestoneCount > 1
            ? `${milestoneCount} paliers cumulés — `
            : ''}
          Bravo pour votre progression en {goalLabel.toLowerCase()}. Continuez sur
          cette lancée !
        </p>

        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={cn(
                'size-2 rounded-full bg-orange-400/30',
                index < Math.min(milestoneCount, 5) && 'animate-weight-flame-spark bg-orange-400',
              )}
              style={{ animationDelay: `${index * 120}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

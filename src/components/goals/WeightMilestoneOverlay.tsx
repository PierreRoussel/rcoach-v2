import { Flame } from 'lucide-react'

import { FullscreenCarouselOverlay } from '@/components/subscription/FullscreenCarouselOverlay'
import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
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
  return (
    <FullscreenCarouselOverlay
      open={open}
      ariaLabel="Palier atteint"
      backgroundClassName="bg-gradient-to-b from-[#FFF7ED] to-[#FFEDD5]"
      onDismissLastStep={onClose}
      slides={[
        <div
          key="milestone"
          className="mx-auto flex w-full max-w-sm flex-col items-center text-center"
        >
          <div className="relative mb-4 flex size-28 items-center justify-center">
            <span className="absolute inset-0 animate-weight-flame-ring rounded-full bg-orange-500/20" />
            <span className="absolute inset-2 animate-weight-flame-ring-delay rounded-full bg-orange-400/25" />
            <Flame className="relative size-16 animate-weight-flame-bounce text-orange-500" />
            <Flame className="absolute -left-2 top-6 size-8 animate-weight-flame-left text-orange-400/80" />
            <Flame className="absolute -right-2 top-8 size-7 animate-weight-flame-right text-orange-400/80" />
          </div>

          <Pill tone="solid-accent" className="gap-1">
            Palier atteint
          </Pill>

          <h2 className="mt-4 font-display text-2xl font-black text-foreground">
            Palier de 500 g !
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {milestoneCount > 1 ? `${milestoneCount} paliers cumulés — ` : ''}
            Bravo pour votre progression en {goalLabel.toLowerCase()}. Continuez
            sur cette lancée !
          </p>

          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className={cn(
                  'size-2 rounded-full bg-orange-400/30',
                  index < Math.min(milestoneCount, 5) &&
                    'animate-weight-flame-spark bg-orange-400',
                )}
                style={{ animationDelay: `${index * 120}ms` }}
              />
            ))}
          </div>
        </div>,
      ]}
      footer={
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button type="button" variant="pill" className="w-full" onClick={onClose}>
            Continuer
          </Button>
        </div>
      }
    />
  )
}

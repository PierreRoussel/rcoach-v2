import { useEffect, useMemo } from 'react'
import { Flame } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NutritionStreakCelebrationOverlayProps = {
  open: boolean
  streak: number
  milestoneMessage: string | null
  onClose: () => void
}

const PARTICLE_COUNT = 28

function FlameParticle({ index }: { index: number }) {
  const left = `${(index * 37 + 11) % 100}%`
  const delay = `${(index * 137) % 2000}ms`
  const duration = `${2200 + (index * 53) % 1200}ms`
  const size = `${1 + (index % 3) * 0.25}rem`

  return (
    <span
      className="pointer-events-none absolute animate-nutrition-flame-fall select-none"
      style={{
        left,
        animationDelay: delay,
        animationDuration: duration,
        fontSize: size,
        top: '-5%',
      }}
      aria-hidden
    >
      🔥
    </span>
  )
}

export function NutritionStreakCelebrationOverlay({
  open,
  streak,
  milestoneMessage,
  onClose,
}: NutritionStreakCelebrationOverlayProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const timer = window.setTimeout(onClose, 4000)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(timer)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Série nutrition"
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: PARTICLE_COUNT }).map((_, index) => (
          <FlameParticle key={index} index={index} />
        ))}
      </div>

      <div
        className={cn(
          'pointer-events-auto relative w-full max-w-sm rounded-3xl border border-orange-500/30',
          'bg-gradient-to-b from-orange-950/95 to-background p-8 text-center shadow-2xl',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative mx-auto mb-4 flex size-28 items-center justify-center">
          <span className="absolute inset-0 animate-weight-flame-ring rounded-full bg-orange-500/20" />
          <Flame className="relative size-16 animate-weight-flame-bounce text-orange-400" />
        </div>

        <p className="font-display text-4xl font-black tabular-nums text-orange-300">
          {streak}
        </p>
        <p className="mt-1 font-display text-lg font-bold text-foreground">
          {streak > 1 ? 'jours de suite !' : 'jour de suite !'}
        </p>

        {milestoneMessage ? (
          <p className="mt-3 text-sm text-muted-foreground">{milestoneMessage}</p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Continuez à logger vos repas chaque jour pour maintenir votre série.
          </p>
        )}

        <Button
          type="button"
          className="mt-6 rounded-full px-8"
          onClick={onClose}
        >
          Continuer
        </Button>
      </div>
    </div>
  )
}

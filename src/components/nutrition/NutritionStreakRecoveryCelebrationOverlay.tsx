import { useEffect } from 'react'
import { Flame, Snowflake, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NutritionStreakRecoveryCelebrationOverlayProps = {
  open: boolean
  streak: number
  onClose: () => void
}

type BlobConfig = {
  size: number
  top: string
  left: string
  delay: number
  duration: number
}

const COLD_BLOBS: BlobConfig[] = [
  { size: 260, top: '-6%', left: '-10%', delay: 0, duration: 14 },
  { size: 200, top: '18%', left: '70%', delay: 0.8, duration: 15 },
  { size: 170, top: '60%', left: '8%', delay: 1.4, duration: 13 },
]

const WARM_BLOBS: BlobConfig[] = [
  { size: 280, top: '-8%', left: '-12%', delay: 0, duration: 14 },
  { size: 220, top: '14%', left: '66%', delay: 1, duration: 16 },
  { size: 190, top: '58%', left: '52%', delay: 0.5, duration: 13 },
]

export function NutritionStreakRecoveryCelebrationOverlay({
  open,
  streak,
  onClose,
}: NutritionStreakRecoveryCelebrationOverlayProps) {
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
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] flex items-center justify-center px-6',
        'animate-nutrition-recovery-bg-melt',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Série récupérée"
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {COLD_BLOBS.map((blob, index) => (
          <span
            key={`cold-${index}`}
            className="absolute rounded-full bg-[#B8D9F8]/60 blur-3xl animate-nutrition-recovery-blob-out"
            style={{
              width: blob.size,
              height: blob.size,
              top: blob.top,
              left: blob.left,
              animationDelay: `${blob.delay}s`,
              animationDuration: `${blob.duration}s`,
            }}
            aria-hidden
          />
        ))}
        {WARM_BLOBS.map((blob, index) => (
          <span
            key={`warm-${index}`}
            className="absolute rounded-full bg-[#FFB899]/55 blur-3xl animate-nutrition-recovery-blob-in"
            style={{
              width: blob.size,
              height: blob.size,
              top: blob.top,
              left: blob.left,
              animationDelay: `${blob.delay + 0.6}s`,
              animationDuration: `${blob.duration}s`,
            }}
            aria-hidden
          />
        ))}
      </div>

      <div
        className="pointer-events-auto relative flex w-full max-w-sm flex-col items-center text-center"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative mb-8 flex size-36 items-center justify-center animate-nutrition-celebration-pop">
          <span className="absolute inset-0 animate-nutrition-recovery-glow rounded-full blur-xl" />
          <span className="absolute inset-3 animate-nutrition-celebration-ring rounded-full border bg-white/40 animate-nutrition-recovery-ring-border" />
          <span className="absolute inset-0 animate-nutrition-celebration-orbit rounded-full border border-dashed animate-nutrition-recovery-orbit-border" />

          <div className="relative flex size-24 items-center justify-center rounded-full bg-white/70 shadow-[0_12px_40px_rgba(100,160,220,0.18)] backdrop-blur-sm animate-nutrition-recovery-disc-shadow">
            <Snowflake
              className="absolute size-11 text-[#5BA4D9] animate-nutrition-recovery-snowflake-out"
              aria-hidden
            />
            <Flame
              className="absolute size-11 fill-[#FF8A4C] text-[#FF8A4C] animate-nutrition-recovery-flame-in"
              aria-hidden
            />
          </div>

          <Sparkles
            className="absolute -right-1 top-2 size-5 animate-nutrition-recovery-spark"
            aria-hidden
          />
          <Sparkles
            className="absolute -left-2 bottom-4 size-4 animate-nutrition-recovery-spark-delay"
            aria-hidden
          />
        </div>

        <div className="animate-nutrition-recovery-content-in space-y-2">
          <p className="font-display text-6xl font-black tabular-nums tracking-tight animate-nutrition-recovery-streak-color">
            {streak}
          </p>
          <p className="font-display text-xl font-bold animate-nutrition-recovery-title-color">
            Série récupérée !
          </p>
        </div>

        <p className="mt-5 max-w-xs animate-nutrition-recovery-content-in text-sm leading-relaxed animate-nutrition-recovery-subtitle-color">
          Votre challenge est terminé — la flamme est de retour. +2 jours ajoutés à votre
          série gelée.
        </p>

        <Button
          type="button"
          variant="outline"
          className={cn(
            'mt-8 rounded-full bg-white/70 px-10 shadow-sm backdrop-blur-sm',
            'animate-nutrition-recovery-content-in animate-nutrition-recovery-button',
          )}
          onClick={onClose}
        >
          Continuer
        </Button>
      </div>
    </div>
  )
}

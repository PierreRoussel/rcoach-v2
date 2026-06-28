import { useEffect } from 'react'
import { Flame, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NutritionStreakCelebrationOverlayProps = {
  open: boolean
  streak: number
  milestoneMessage: string | null
  onClose: () => void
}

type OrganicBlobConfig = {
  size: number
  top: string
  left: string
  tone: 'peach' | 'coral' | 'amber' | 'rose'
  delay: number
  duration: number
}

const BLOBS: OrganicBlobConfig[] = [
  { size: 280, top: '-8%', left: '-12%', tone: 'peach', delay: 0, duration: 14 },
  { size: 220, top: '12%', left: '68%', tone: 'coral', delay: 1.2, duration: 16 },
  { size: 180, top: '58%', left: '-6%', tone: 'amber', delay: 0.6, duration: 13 },
  { size: 240, top: '62%', left: '58%', tone: 'rose', delay: 2, duration: 15 },
  { size: 120, top: '34%', left: '22%', tone: 'peach', delay: 0.8, duration: 11 },
  { size: 96, top: '78%', left: '34%', tone: 'coral', delay: 1.6, duration: 12 },
]

const TONE_CLASS: Record<OrganicBlobConfig['tone'], string> = {
  peach: 'bg-[#FFDCC8]/70',
  coral: 'bg-[#FFB899]/55',
  amber: 'bg-[#FFE0A3]/50',
  rose: 'bg-[#FFCAB8]/60',
}

function OrganicBlob({ blob }: { blob: OrganicBlobConfig }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute rounded-full blur-3xl',
        TONE_CLASS[blob.tone],
        'animate-nutrition-celebration-blob',
      )}
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

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] flex items-center justify-center px-6',
        'bg-[#FFF3EC] animate-nutrition-celebration-enter',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Série nutrition"
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {BLOBS.map((blob, index) => (
          <OrganicBlob key={index} blob={blob} />
        ))}
      </div>

      <div
        className="pointer-events-auto relative flex w-full max-w-sm flex-col items-center text-center"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative mb-8 flex size-36 items-center justify-center animate-nutrition-celebration-pop">
          <span className="absolute inset-0 animate-nutrition-celebration-glow rounded-full bg-[#FFB088]/35 blur-xl" />
          <span className="absolute inset-3 animate-nutrition-celebration-ring rounded-full border border-[#FF9F6A]/25 bg-white/40" />
          <span className="absolute inset-0 animate-nutrition-celebration-orbit rounded-full border border-dashed border-[#FFBA8A]/40" />
          <div className="relative flex size-24 items-center justify-center rounded-full bg-white/70 shadow-[0_12px_40px_rgba(255,145,90,0.18)] backdrop-blur-sm animate-nutrition-celebration-float">
            <Flame className="size-11 fill-[#FF8A4C] text-[#FF8A4C]" aria-hidden />
          </div>
          <Sparkles
            className="absolute -right-1 top-2 size-5 text-[#FF9F6A]/80 animate-nutrition-celebration-spark"
            aria-hidden
          />
          <Sparkles
            className="absolute -left-2 bottom-4 size-4 text-[#FFB088]/70 animate-nutrition-celebration-spark-delay"
            aria-hidden
          />
        </div>

        <div className="animate-nutrition-celebration-pop-delay space-y-2">
          <p className="font-display text-6xl font-black tabular-nums tracking-tight text-[#E85D24]">
            {streak}
          </p>
          <p className="font-display text-xl font-bold text-[#5C4033]">
            {streak > 1 ? 'jours de suite' : 'jour de suite'}
          </p>
        </div>

        <p className="mt-5 max-w-xs animate-nutrition-celebration-pop-delay text-sm leading-relaxed text-[#8B6555]">
          {milestoneMessage ??
            'Continuez à logger vos repas chaque jour pour maintenir votre série.'}
        </p>

        <Button
          type="button"
          variant="outline"
          className={cn(
            'mt-8 rounded-full border-[#FFBA8A]/60 bg-white/70 px-10',
            'text-[#5C4033] shadow-sm backdrop-blur-sm',
            'hover:bg-white hover:text-[#E85D24]',
            'animate-nutrition-celebration-pop-delay',
          )}
          onClick={onClose}
        >
          Continuer
        </Button>
      </div>
    </div>
  )
}

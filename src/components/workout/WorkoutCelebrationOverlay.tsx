import { useEffect } from 'react'
import { CircleCheckBig, Sparkles } from 'lucide-react'

import { WorkoutStreakIcon } from '@/components/schedule/WorkoutStreakIcon'
import { Button } from '@/components/ui/button'
import type { WorkoutCelebrationKind } from '@/lib/workout/workout-celebration'
import { cn } from '@/lib/utils'

type WorkoutCelebrationOverlayProps = {
  open: boolean
  variant: WorkoutCelebrationKind
  weeklyStreak?: number
  onClose: () => void
}

type BlobConfig = {
  size: number
  top: string
  left: string
  delay: number
  duration: number
}

const PLANNED_BLOBS: BlobConfig[] = [
  { size: 260, top: '-8%', left: '-10%', delay: 0, duration: 14 },
  { size: 210, top: '16%', left: '68%', delay: 0.9, duration: 15 },
  { size: 180, top: '58%', left: '6%', delay: 0.5, duration: 13 },
  { size: 130, top: '72%', left: '58%', delay: 1.4, duration: 12 },
]

const WEEKLY_BLOBS: BlobConfig[] = [
  { size: 250, top: '-6%', left: '-8%', delay: 0, duration: 14 },
  { size: 200, top: '20%', left: '64%', delay: 1.1, duration: 16 },
  { size: 170, top: '62%', left: '12%', delay: 0.7, duration: 13 },
]

const COPY: Record<
  WorkoutCelebrationKind,
  { title: string; subtitle: string; description: string }
> = {
  planned: {
    title: 'Plan respecté !',
    subtitle: 'Séance du jour validée',
    description:
      'Vous avez suivi votre planification — bravo pour cette régularité.',
  },
  weekly_streak: {
    title: 'Semaine lancée !',
    subtitle: 'Première séance de la semaine',
    description:
      'Votre série hebdomadaire progresse. Continuez sur cette lancée !',
  },
}

function CelebrationIcon({
  variant,
  weeklyStreak,
}: {
  variant: WorkoutCelebrationKind
  weeklyStreak: number
}) {
  if (variant === 'planned') {
    return (
      <div className="relative flex size-24 items-center justify-center rounded-full bg-white/75 shadow-[0_12px_40px_rgba(34,197,94,0.18)] backdrop-blur-sm animate-workout-celebration-float">
        <span className="text-5xl leading-none" aria-hidden>
          ✅
        </span>
      </div>
    )
  }

  return (
    <div className="relative flex size-24 items-center justify-center rounded-full bg-white/75 shadow-[0_12px_40px_color-mix(in_srgb,var(--workout-streak)_28%,transparent)] backdrop-blur-sm animate-workout-celebration-float">
      <WorkoutStreakIcon className="size-11" />
      <span className="absolute -bottom-1 rounded-full bg-workout-streak px-2 py-0.5 font-display text-xs font-black text-workout-streak-foreground">
        {weeklyStreak}
      </span>
    </div>
  )
}

export function WorkoutCelebrationOverlay({
  open,
  variant,
  weeklyStreak = 1,
  onClose,
}: WorkoutCelebrationOverlayProps) {
  const copy = COPY[variant]
  const isPlanned = variant === 'planned'
  const blobs = isPlanned ? PLANNED_BLOBS : WEEKLY_BLOBS

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
        'fixed inset-0 z-[70] flex items-center justify-center px-6',
        isPlanned ? 'bg-[#ECFDF3]' : 'bg-[#E8FAF3]',
        'animate-workout-celebration-enter',
      )}
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {blobs.map((blob, index) => (
          <span
            key={index}
            className={cn(
              'absolute rounded-full blur-3xl animate-workout-celebration-blob',
              isPlanned ? 'bg-[#86EFAC]/55' : 'bg-[#6EE7B7]/50',
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
        ))}
      </div>

      <div
        className="pointer-events-auto relative flex w-full max-w-sm flex-col items-center text-center"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative mb-8 flex size-36 items-center justify-center animate-workout-celebration-pop">
          <span
            className={cn(
              'absolute inset-0 animate-workout-celebration-glow rounded-full blur-xl',
              isPlanned ? 'bg-[#4ADE80]/30' : 'bg-[#34D399]/30',
            )}
          />
          <span
            className={cn(
              'absolute inset-3 animate-workout-celebration-ring rounded-full border bg-white/40',
              isPlanned ? 'border-[#4ADE80]/30' : 'border-[#34D399]/30',
            )}
          />
          <span
            className={cn(
              'absolute inset-0 animate-workout-celebration-orbit rounded-full border border-dashed',
              isPlanned ? 'border-[#86EFAC]/50' : 'border-[#6EE7B7]/50',
            )}
          />

          <CelebrationIcon variant={variant} weeklyStreak={weeklyStreak} />

          <Sparkles
            className={cn(
              'absolute -right-1 top-2 size-5 animate-workout-celebration-spark',
              isPlanned ? 'text-[#22C55E]/80' : 'text-[#10B981]/80',
            )}
            aria-hidden
          />
          {!isPlanned ? (
            <CircleCheckBig
              className="absolute -left-2 bottom-3 size-5 text-emerald-500/80 animate-workout-celebration-spark-delay"
              aria-hidden
            />
          ) : null}
        </div>

        <div className="animate-workout-celebration-pop-delay space-y-2">
          <p
            className={cn(
              'font-display text-2xl font-black',
              isPlanned ? 'text-[#15803D]' : 'text-[#047857]',
            )}
          >
            {copy.title}
          </p>
          <p className="font-display text-lg font-bold text-[#1F2937]">{copy.subtitle}</p>
        </div>

        <p className="mt-5 max-w-xs animate-workout-celebration-pop-delay text-sm leading-relaxed text-[#4B5563]">
          {variant === 'weekly_streak'
            ? `${copy.description} Série : ${weeklyStreak} semaine${weeklyStreak > 1 ? 's' : ''} d'affilée.`
            : copy.description}
        </p>

        <Button
          type="button"
          variant="outline"
          className={cn(
            'mt-8 rounded-full border bg-white/75 px-10 shadow-sm backdrop-blur-sm',
            'animate-workout-celebration-pop-delay',
            isPlanned
              ? 'border-[#86EFAC]/70 text-[#166534] hover:bg-white hover:text-[#15803D]'
              : 'border-[#6EE7B7]/70 text-[#047857] hover:bg-white hover:text-[#065F46]',
          )}
          onClick={onClose}
        >
          Continuer
        </Button>
      </div>
    </div>
  )
}

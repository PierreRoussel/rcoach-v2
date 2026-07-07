import { Crown, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Pill } from '@/design-system'
import { consumePremiumHomeCelebrationPending } from '@/lib/subscription/premium-home-celebration'
import { cn } from '@/lib/utils'

const VISIBLE_MS = 2400
const EXIT_MS = 500

export function PremiumHomeWelcomeAnimation() {
  const [phase, setPhase] = useState<'hidden' | 'enter' | 'exit'>('hidden')

  useEffect(() => {
    if (!consumePremiumHomeCelebrationPending()) {
      return
    }

    setPhase('enter')
    const exitTimer = window.setTimeout(() => setPhase('exit'), VISIBLE_MS)
    const hideTimer = window.setTimeout(() => setPhase('hidden'), VISIBLE_MS + EXIT_MS)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  if (phase === 'hidden') {
    return null
  }

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4',
        'top-[max(4.75rem,calc(env(safe-area-inset-top)+3.5rem))]',
        phase === 'enter' && 'animate-workout-celebration-enter',
        phase === 'exit' && 'animate-out fade-out slide-out-to-top-2 duration-500',
      )}
      aria-live="polite"
      aria-label="Bienvenue en Premium"
    >
      <div className="relative animate-workout-celebration-pop">
        <span
          className="absolute -inset-3 rounded-full bg-amber-400/25 blur-xl animate-workout-celebration-glow"
          aria-hidden
        />
        <Pill
          tone="solid-gold"
          className="relative gap-2 px-4 py-2 text-sm shadow-[0_12px_32px_rgba(245,158,11,0.28)]"
        >
          <Crown className="size-4" aria-hidden />
          <span className="font-display font-black">Bienvenue en Premium</span>
          <Sparkles className="size-4 animate-workout-celebration-spark" aria-hidden />
        </Pill>
      </div>
    </div>
  )
}

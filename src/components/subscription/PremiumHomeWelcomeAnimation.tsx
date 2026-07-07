import { Crown, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Pill } from '@/design-system'
import {
  consumePremiumHomeCelebrationPending,
  hasPremiumHomeCelebrationPending,
} from '@/lib/subscription/premium-home-celebration'
import { cn } from '@/lib/utils'

const VISIBLE_MS = 3200
const EXIT_MS = 600

export function PremiumHomeWelcomeAnimation() {
  const [phase, setPhase] = useState<'hidden' | 'visible' | 'exit'>('hidden')

  useEffect(() => {
    if (!hasPremiumHomeCelebrationPending()) {
      return
    }

    setPhase('visible')

    const exitTimer = window.setTimeout(() => setPhase('exit'), VISIBLE_MS)
    const hideTimer = window.setTimeout(() => {
      consumePremiumHomeCelebrationPending()
      setPhase('hidden')
    }, VISIBLE_MS + EXIT_MS)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  if (phase === 'hidden') {
    return null
  }

  const isExiting = phase === 'exit'

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4',
        'top-[max(4.75rem,calc(env(safe-area-inset-top)+3.5rem))]',
        'transition-[opacity,transform] duration-500 ease-in',
        phase === 'visible' && 'animate-workout-celebration-enter opacity-100',
        isExiting && 'translate-y-[-10px] opacity-0',
      )}
      aria-live="polite"
      aria-label="Bienvenue en Premium"
    >
      <div className={cn('relative', phase === 'visible' && 'animate-workout-celebration-pop')}>
        {phase === 'visible' ? (
          <span
            className="absolute -inset-3 rounded-full bg-amber-400/25 blur-xl animate-workout-celebration-glow"
            aria-hidden
          />
        ) : null}
        <Pill
          tone="solid-gold"
          className="relative gap-2 px-4 py-2 text-sm shadow-[0_12px_32px_rgba(245,158,11,0.28)]"
        >
          <Crown className="size-4" aria-hidden />
          <span className="font-display font-black">Bienvenue en Premium</span>
          {phase === 'visible' ? (
            <Sparkles className="size-4 animate-workout-celebration-spark" aria-hidden />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
        </Pill>
      </div>
    </div>
  )
}

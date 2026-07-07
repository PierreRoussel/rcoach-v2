import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Crown, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
import { cn } from '@/lib/utils'

type PremiumCelebrationOverlayProps = {
  open: boolean
  onClose: () => void
}

export function PremiumCelebrationOverlay({ open, onClose }: PremiumCelebrationOverlayProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[70] flex items-center justify-center px-6',
        'bg-gradient-to-br from-primary/15 via-background to-accent/20',
        'animate-workout-celebration-enter',
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-celebration-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm space-y-5 rounded-3xl border border-border bg-card/95 p-6 text-center shadow-xl backdrop-blur-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Crown className="size-10" aria-hidden />
        </div>
        <div className="space-y-2">
          <Pill tone="solid-primary" className="mx-auto w-fit gap-1">
            <Sparkles className="size-3.5" aria-hidden />
            Premium activé
          </Pill>
          <h2 id="premium-celebration-title" className="font-display text-2xl font-black">
            Bienvenue en Premium
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Vous débloquez l’ajustement illimité des charges, les stats avancées, le badge Pro
            et bien plus encore.
          </p>
        </div>
        <Button variant="pill" className="w-full" onClick={onClose}>
          C’est parti
        </Button>
        <Button variant="ghost" className="w-full" asChild>
          <Link to="/app/profile/subscription">Gérer mon abonnement</Link>
        </Button>
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Crown, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
import { cn } from '@/lib/utils'

type OverloadTeaserOverlayProps = {
  open: boolean
  onClose: () => void
}

export function OverloadTeaserOverlay({ open, onClose }: OverloadTeaserOverlayProps) {
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
        'bg-gradient-to-br from-accent/20 via-background to-primary/10',
        'animate-workout-celebration-enter',
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="overload-teaser-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm space-y-5 rounded-3xl border border-border bg-card/95 p-6 text-center shadow-xl backdrop-blur-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent/20 text-accent-foreground">
          <TrendingUp className="size-10" aria-hidden />
        </div>
        <div className="space-y-2">
          <Pill tone="accent" className="mx-auto w-fit">
            Conseil appliqué
          </Pill>
          <h2 id="overload-teaser-title" className="font-display text-2xl font-black">
            1 conseil gratuit par jour
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Vous venez d’utiliser votre conseil du jour. Passez en Premium pour un ajustement
            illimité des charges sur tous vos exercices.
          </p>
        </div>
        <Button variant="pill" className="w-full gap-2" asChild>
          <Link to="/app/premium" onClick={onClose}>
            <Crown className="size-4" aria-hidden />
            Débloquer Premium
          </Link>
        </Button>
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Continuer la séance
        </Button>
      </div>
    </div>
  )
}

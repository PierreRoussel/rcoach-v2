import { Link } from '@tanstack/react-router'
import { Crown, Lock, Sparkles } from 'lucide-react'

import { FullscreenCarouselOverlay } from '@/components/subscription/FullscreenCarouselOverlay'
import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
import { COMPARE_FEATURES } from '@/lib/subscription/plans'
import { FREE_WORKOUT_TEMPLATES } from '@/lib/subscription/entitlements'

type TrialExpiredOverlayProps = {
  open: boolean
  templateCount: number
  frozenCount: number
  onDismiss: () => void
}

export function TrialExpiredOverlay({
  open,
  templateCount,
  frozenCount,
  onDismiss,
}: TrialExpiredOverlayProps) {
  const lostFeatures = COMPARE_FEATURES.filter(
    (feature) => feature.premium === true || feature.premium === 'Illimité',
  ).slice(0, 5)

  const slides = [
    <div key="ended" className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
      <Crown className="mb-4 size-10 text-muted-foreground" aria-hidden />
      <Pill tone="secondary">Essai terminé</Pill>
      <h2 className="mt-4 font-display text-2xl font-black text-foreground">
        Votre essai Premium est terminé
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Vous êtes repassé au plan Gratuit. Reprenez Premium pour retrouver tous vos avantages.
      </p>
    </div>,
    <div key="lost" className="mx-auto w-full max-w-sm space-y-4">
      <h3 className="text-center font-display text-xl font-black text-foreground">
        Privilèges perdus
      </h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {lostFeatures.map((feature) => (
          <li key={feature.id} className="rounded-xl border border-border bg-white/70 px-3 py-2">
            {feature.label}
          </li>
        ))}
      </ul>
    </div>,
    <div key="frozen" className="mx-auto w-full max-w-sm space-y-4 text-center">
      <Lock className="mx-auto size-10 text-amber-500" aria-hidden />
      <h3 className="font-display text-xl font-black text-foreground">
        Modèles gelés
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {templateCount > FREE_WORKOUT_TEMPLATES ? (
          <>
            {FREE_WORKOUT_TEMPLATES} modèles restent accessibles (les plus utilisés).
            {frozenCount > 0 ? (
              <> {frozenCount} seront gelés jusqu&apos;à votre réabonnement.</>
            ) : null}
          </>
        ) : (
          <>Vos modèles restent visibles, mais certaines actions Premium sont limitées.</>
        )}
      </p>
    </div>,
    <div key="cta" className="mx-auto w-full max-w-sm space-y-4 text-center">
      <Sparkles className="mx-auto size-8 text-amber-500" aria-hidden />
      <h3 className="font-display text-xl font-black text-foreground">
        Reprendre Premium
      </h3>
      <Button variant="pill" className="w-full" asChild onClick={onDismiss}>
        <Link to="/app/premium">Voir les offres Premium</Link>
      </Button>
      <Button variant="ghost" className="w-full text-muted-foreground" asChild onClick={onDismiss}>
        <Link to="/app/profile/subscription">Gérer mon abonnement</Link>
      </Button>
      <Button variant="outline" className="w-full" onClick={onDismiss}>
        Continuer en Gratuit
      </Button>
    </div>,
  ]

  return (
    <FullscreenCarouselOverlay
      open={open}
      ariaLabel="Fin de l'essai Premium"
      slides={slides}
      onDismissLastStep={onDismiss}
    />
  )
}

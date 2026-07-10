import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { FREE_PLAN, PREMIUM_PLAN } from '@/lib/subscription/plans'
import { MarketingSectionHeader } from '@/components/marketing/MarketingSectionHeader'
import { cn } from '@/lib/utils'

type FreePremiumOverviewProps = {
  className?: string
  showCta?: boolean
}

export function FreePremiumOverview({ className, showCta = true }: FreePremiumOverviewProps) {
  return (
    <section className={cn('bg-muted/25 py-12', className)}>
      <div className="mx-auto max-w-6xl px-4">
        <MarketingSectionHeader
          eyebrow="Formules"
          title="Gratuit pour commencer, Premium pour accélérer"
          description="Toutes les bases sont accessibles sans carte bancaire. Premium débloque l’historique illimité, les stats avancées et l’accompagnement nutrition."
          align="center"
          className="mb-10"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <p className="font-display text-2xl font-black">{FREE_PLAN.name}</p>
            <p className="mt-2 text-sm text-muted-foreground">{FREE_PLAN.description}</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {FREE_PLAN.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {showCta ? (
              <Button variant="soft" className="mt-6 w-full rounded-xl" asChild>
                <Link to="/auth/register">Créer un compte gratuit</Link>
              </Button>
            ) : null}
          </div>

          <div className="rounded-3xl border border-primary/25 bg-primary/5 p-6 md:p-8">
            <p className="font-display text-2xl font-black text-primary">{PREMIUM_PLAN.name}</p>
            <p className="mt-2 text-sm text-muted-foreground">{PREMIUM_PLAN.description}</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {PREMIUM_PLAN.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {showCta ? (
              <Button variant="pill" className="mt-6 w-full rounded-xl" asChild>
                <Link to="/tarifs">Voir les tarifs Premium</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

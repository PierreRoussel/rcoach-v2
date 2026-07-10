import { Link } from '@tanstack/react-router'

import { SubscriptionCompareTable } from '@/components/subscription/SubscriptionCompareTable'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  FREE_PLAN,
  PREMIUM_PLAN,
  annualSavingsPercent,
  formatPriceEuros,
  monthlyEquivalentFromAnnual,
} from '@/lib/subscription/plans'

export function PricingTable() {
  const savings = annualSavingsPercent(PREMIUM_PLAN)

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">{FREE_PLAN.name}</CardTitle>
            <CardDescription>{FREE_PLAN.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-black">Gratuit</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {FREE_PLAN.features.slice(0, 4).map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <Button variant="soft" className="mt-6 w-full rounded-xl" asChild>
              <Link to="/auth/register">Commencer</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="font-display font-black text-primary">
              {PREMIUM_PLAN.name}
            </CardTitle>
            <CardDescription>{PREMIUM_PLAN.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-black">
              {formatPriceEuros(PREMIUM_PLAN.monthlyPriceCents)}
              <span className="text-base font-semibold text-muted-foreground"> / mois</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              ou {formatPriceEuros(PREMIUM_PLAN.annualPriceCents)} / an (
              {monthlyEquivalentFromAnnual(PREMIUM_PLAN)} / mois, -{savings} %)
            </p>
            <Button variant="pill" className="mt-6 w-full rounded-xl" asChild>
              <Link to="/auth/register">Essayer Premium</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <SubscriptionCompareTable />
      </div>
    </section>
  )
}

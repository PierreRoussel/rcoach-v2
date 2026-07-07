import { Link } from '@tanstack/react-router'
import { ArrowLeft, Crown, Sparkles, Target, Utensils, Dumbbell } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader, Pill } from '@/design-system'

const PREMIUM_BENEFITS = [
  {
    icon: Target,
    title: 'Coaching objectifs',
    description:
      'Des conseils personnalisés pour ajuster votre perte ou prise de poids semaine après semaine.',
  },
  {
    icon: Utensils,
    title: 'Nutrition guidée',
    description:
      'Menus, ajustements caloriques et recommandations adaptées à votre profil et votre rythme.',
  },
  {
    icon: Dumbbell,
    title: 'Programmes sur mesure',
    description:
      'Des séances structurées pour accélérer vos résultats sans vous épuiser.',
  },
  {
    icon: Sparkles,
    title: 'Suivi avancé',
    description:
      'Analyses détaillées, alertes intelligentes et accompagnement pour rester régulier.',
  },
] as const

export function PremiumOfferPage() {
  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-start gap-3">
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-full border-border/70 bg-card shadow-sm"
          asChild
        >
          <Link to="/app/goals" aria-label="Retour aux objectifs">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <PageHeader
          eyebrow="RCoach Premium"
          title="Plus de conseils pour aller plus loin"
          description="Débloquez un accompagnement complet pour atteindre vos objectifs plus sereinement."
        />
      </div>

      <Card className="overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="solid-primary">Offre Premium</Pill>
            <Pill tone="accent">Bientôt disponible</Pill>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Crown className="size-6" aria-hidden />
            </span>
            <div>
              <CardTitle className="font-display text-xl font-black">
                Un coach dans votre poche
              </CardTitle>
              <CardDescription className="mt-1">
                Nutrition, entraînement et motivation réunis dans une seule offre.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Passez au niveau supérieur avec des recommandations personnalisées,
            un suivi plus fin de votre progression et des plans conçus pour vous
            aider à tenir votre objectif sur la durée.
          </p>
          <Button type="button" variant="pill" className="w-full" disabled>
            Découvrir l&apos;offre Premium
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            L&apos;abonnement sera bientôt disponible directement dans l&apos;application.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {PREMIUM_BENEFITS.map((benefit) => (
          <Card key={benefit.title} className="rounded-2xl border-border">
            <CardContent className="flex items-start gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft-primary text-primary">
                <benefit.icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-display font-black text-foreground">{benefit.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

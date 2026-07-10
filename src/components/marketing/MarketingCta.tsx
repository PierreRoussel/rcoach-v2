import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

type MarketingCtaProps = {
  title?: string
  description?: string
  ctaLabel?: string
  ctaTo?: string
}

export function MarketingCta({
  title = 'Prêt à progresser ?',
  description = 'Créez votre compte gratuitement et commencez à suivre vos séances et vos repas dès aujourd’hui.',
  ctaLabel = 'Créer mon compte',
  ctaTo = '/auth/register',
}: MarketingCtaProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-6 py-10 text-center md:px-10">
        <h2 className="font-display text-3xl font-black">{title}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{description}</p>
        <Button variant="pill" size="lg" className="mt-6 rounded-full" asChild>
          <Link to={ctaTo}>{ctaLabel}</Link>
        </Button>
      </div>
    </section>
  )
}

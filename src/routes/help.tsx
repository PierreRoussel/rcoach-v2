import { createFileRoute, Link } from '@tanstack/react-router'

import { LegalLinksRow } from '@/components/legal/LegalLinksRow'
import { BrandLogo } from '@/design-system'
import {
  LEGAL_PATHS,
  SUPPORT_EMAIL,
  supportMailto,
} from '@/lib/legal/config'

export const Route = createFileRoute('/help')({
  component: HelpPage,
})

const faqItems = [
  {
    question: 'Comment supprimer mon compte ?',
    answer:
      'Connectez-vous, ouvrez Profil → Configuration du compte → Supprimer mon compte. La suppression est définitive sous 30 jours.',
  },
  {
    question: 'Comment exporter mes données ?',
    answer: `Envoyez une demande à ${SUPPORT_EMAIL} depuis l’adresse email de votre compte. Nous vous répondrons sous 30 jours.`,
  },
  {
    question: 'Comment gérer mon abonnement Premium ?',
    answer:
      'Depuis Profil → Abonnement, ou via Google Play (Android) / Stripe (web) selon votre mode de paiement.',
  },
  {
    question: 'Je n’ai pas reçu l’email de confirmation',
    answer:
      'Vérifiez les spams. Si le problème persiste, contactez le support avec votre adresse email.',
  },
] as const

function HelpPage() {
  return (
    <div className="mx-auto min-h-svh max-w-2xl bg-background px-4 py-8">
      <BrandLogo compact />
      <header className="mt-8 space-y-2">
        <h1 className="font-display text-3xl font-black">Aide & support</h1>
        <p className="text-muted-foreground">
          Besoin d’aide ? Notre équipe vous répond par email.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold">Nous contacter</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Décrivez votre problème (compte, abonnement, bug, données personnelles).
        </p>
        <a
          href={supportMailto('Demande support RCoach')}
          className="mt-4 inline-flex text-base font-semibold text-primary underline-offset-2 hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>
      </section>

      <section className="mt-10 space-y-6">
        <h2 className="font-display text-lg font-bold">Questions fréquentes</h2>
        {faqItems.map((item) => (
          <div key={item.question}>
            <h3 className="text-sm font-semibold">{item.question}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-bold">Informations légales</h2>
        <LegalLinksRow includeCgv className="justify-start" />
        <p className="mt-4 text-sm">
          <Link to={LEGAL_PATHS.about} className="text-primary underline-offset-2 hover:underline">
            À propos de RCoach
          </Link>
        </p>
      </section>
    </div>
  )
}

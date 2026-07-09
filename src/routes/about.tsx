import { createFileRoute, Link } from '@tanstack/react-router'

import { LegalLinksRow } from '@/components/legal/LegalLinksRow'
import { BrandLogo } from '@/design-system'
import {
  APP_VERSION,
  LEGAL_PUBLISHER_NAME,
  LEGAL_PATHS,
  supportMailto,
} from '@/lib/legal/config'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <div className="mx-auto min-h-svh max-w-2xl bg-background px-4 py-8">
      <BrandLogo compact />
      <header className="mt-8 space-y-2">
        <h1 className="font-display text-3xl font-black">À propos de RCoach</h1>
        <p className="text-muted-foreground">
          Application de coaching sportif et nutrition par {LEGAL_PUBLISHER_NAME}.
        </p>
      </header>

      <dl className="mt-8 space-y-4 text-sm">
        <div>
          <dt className="font-semibold">Version</dt>
          <dd className="text-muted-foreground">{APP_VERSION}</dd>
        </div>
        <div>
          <dt className="font-semibold">Éditeur</dt>
          <dd className="text-muted-foreground">{LEGAL_PUBLISHER_NAME}</dd>
        </div>
      </dl>

      <div className="mt-10">
        <LegalLinksRow includeCgv className="justify-start" />
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        <Link to={LEGAL_PATHS.help} className="text-primary underline-offset-2 hover:underline">
          Centre d’aide
        </Link>
        {' · '}
        <a href={supportMailto()} className="text-primary underline-offset-2 hover:underline">
          support@rcoach.fr
        </a>
      </p>
    </div>
  )
}

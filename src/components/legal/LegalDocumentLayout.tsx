import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import type { LegalDocument } from '@/content/legal/types'
import { BrandLogo } from '@/design-system'
import {
  isLegalConfigComplete,
  LEGAL_LAST_UPDATED,
  supportMailto,
} from '@/lib/legal/config'
import { cn } from '@/lib/utils'

type LegalDocumentLayoutProps = {
  document: LegalDocument
  children?: ReactNode
  className?: string
}

export function LegalDocumentLayout({
  document,
  children,
  className,
}: LegalDocumentLayoutProps) {
  return (
    <div className={cn('mx-auto min-h-svh max-w-2xl bg-background px-4 py-8', className)}>
      <div className="mb-8 flex items-center justify-between gap-4">
        <BrandLogo compact />
        <Link
          to="/help"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Aide & support
        </Link>
      </div>

      {!isLegalConfigComplete() ? (
        <p className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Informations légales incomplètes (placeholders). À compléter avant publication Play
          Store.
        </p>
      ) : null}

      <header className="mb-8 space-y-2">
        <h1 className="font-display text-3xl font-black tracking-tight">{document.title}</h1>
        <p className="text-muted-foreground">{document.description}</p>
        <p className="text-xs text-muted-foreground">Dernière mise à jour : {LEGAL_LAST_UPDATED}</p>
      </header>

      {children ?? (
        <div className="space-y-8">
          {document.sections.map((section) => (
            <section key={section.id ?? section.title} id={section.id}>
              <h2 className="mb-3 font-display text-lg font-bold">{section.title}</h2>
              <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
        <p>
          Une question ?{' '}
          <a className="font-medium text-primary underline-offset-2 hover:underline" href={supportMailto('Question RCoach')}>
            Contactez le support
          </a>
        </p>
        <p className="mt-2">
          <Link to="/legal/privacy" className="underline-offset-2 hover:underline">
            Confidentialité
          </Link>
          {' · '}
          <Link to="/legal/terms" className="underline-offset-2 hover:underline">
            CGU
          </Link>
          {' · '}
          <Link to="/about" className="underline-offset-2 hover:underline">
            À propos
          </Link>
        </p>
      </footer>
    </div>
  )
}

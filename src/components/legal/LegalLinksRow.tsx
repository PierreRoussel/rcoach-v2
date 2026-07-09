import { Link } from '@tanstack/react-router'

import { LEGAL_PATHS } from '@/lib/legal/config'
import { cn } from '@/lib/utils'

type LegalLinksRowProps = {
  className?: string
  includeCgv?: boolean
}

export function LegalLinksRow({ className, includeCgv = false }: LegalLinksRowProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground', className)}>
      <Link to={LEGAL_PATHS.terms} className="underline-offset-2 hover:underline">
        CGU
      </Link>
      <Link to={LEGAL_PATHS.privacy} className="underline-offset-2 hover:underline">
        Confidentialité
      </Link>
      {includeCgv ? (
        <Link to={LEGAL_PATHS.cgv} className="underline-offset-2 hover:underline">
          CGV
        </Link>
      ) : null}
      <Link to={LEGAL_PATHS.help} className="underline-offset-2 hover:underline">
        Support
      </Link>
    </div>
  )
}

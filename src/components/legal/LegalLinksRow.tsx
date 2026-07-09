import { StandaloneDocumentLink } from '@/components/legal/StandaloneDocumentLink'
import { LEGAL_PATHS } from '@/lib/legal/config'
import { cn } from '@/lib/utils'

type LegalLinksRowProps = {
  className?: string
  includeCgv?: boolean
}

const linkClassName = 'underline-offset-2 hover:underline'

export function LegalLinksRow({ className, includeCgv = false }: LegalLinksRowProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground',
        className,
      )}
    >
      <StandaloneDocumentLink path={LEGAL_PATHS.terms} className={linkClassName}>
        CGU
      </StandaloneDocumentLink>
      <StandaloneDocumentLink path={LEGAL_PATHS.privacy} className={linkClassName}>
        Confidentialité
      </StandaloneDocumentLink>
      {includeCgv ? (
        <StandaloneDocumentLink path={LEGAL_PATHS.cgv} className={linkClassName}>
          CGV
        </StandaloneDocumentLink>
      ) : null}
      <StandaloneDocumentLink path={LEGAL_PATHS.help} className={linkClassName}>
        Support
      </StandaloneDocumentLink>
    </div>
  )
}

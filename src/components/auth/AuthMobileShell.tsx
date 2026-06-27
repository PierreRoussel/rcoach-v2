import type { ReactNode } from 'react'

import { AuthMarketingHero } from '@/components/auth/AuthMarketingHero'
import {
  AUTH_MARKETING_CONTENT,
  type AuthMarketingVariant,
} from '@/lib/auth/marketing'
import { cn } from '@/lib/utils'

type AuthMobileShellProps = {
  variant?: AuthMarketingVariant
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function AuthMobileShell({
  variant = 'recovery',
  title,
  description,
  children,
  footer,
  className,
}: AuthMobileShellProps) {
  const marketing = AUTH_MARKETING_CONTENT[variant]
  const sheetTitle = title ?? marketing.sheetTitle
  const sheetDescription = description
  const isMarketingCompact = variant === 'login' || variant === 'register'

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-hidden overflow-y-auto bg-gradient-hero">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.55),transparent_70%)]" />

      <div
        className={cn(
          'relative z-0 shrink-0 px-4 pb-0 pt-[max(0.75rem,env(safe-area-inset-top))]',
          isMarketingCompact ? 'pb-1' : 'flex flex-1 flex-col pb-2',
        )}
      >
        <AuthMarketingHero
          variant={variant}
          compact={isMarketingCompact}
          className={isMarketingCompact ? 'py-1' : 'flex-1 justify-center py-2'}
        />
      </div>

      <div
        className={cn(
          'relative z-20 shrink-0 rounded-t-[1.75rem] border border-border/60 bg-background/95 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] backdrop-blur-md',
          isMarketingCompact && '-mt-6',
          className,
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
        <div className="mb-4 space-y-1">
          <h2 className="font-display text-xl font-black text-foreground">{sheetTitle}</h2>
          {sheetDescription ? (
            <p className="text-sm text-muted-foreground">{sheetDescription}</p>
          ) : null}
        </div>

        {children}
        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </div>
  )
}

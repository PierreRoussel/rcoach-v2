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

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-gradient-hero">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.55),transparent_70%)]" />

      <div className="relative z-0 flex flex-1 flex-col px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <AuthMarketingHero variant={variant} className="flex-1 justify-center py-2" />
      </div>

      <div
        className={cn(
          'relative z-20 rounded-t-[1.75rem] border border-border/60 bg-background/95 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] backdrop-blur-md',
          className,
        )}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
        <div className="mb-5 space-y-1">
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

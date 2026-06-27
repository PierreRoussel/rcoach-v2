import type { ReactNode } from 'react'

import { BrandLogo } from '@/design-system/components/brand-logo'
import { cn } from '@/lib/utils'

type AuthMobileShellProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function AuthMobileShell({
  title,
  description,
  children,
  footer,
  className,
}: AuthMobileShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-gradient-hero">
      <div className="flex flex-1 flex-col justify-end px-4 pb-0 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo compact className="mb-4" />
          <h1 className="font-display text-2xl font-black text-foreground">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div
          className={cn(
            'rounded-t-3xl border border-border/60 bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-lg',
            className,
          )}
        >
          {children}
          {footer ? <div className="mt-4">{footer}</div> : null}
        </div>
      </div>
    </div>
  )
}

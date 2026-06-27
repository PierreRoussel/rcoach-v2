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
  const isRegister = variant === 'register'
  const isMarketingCompact = variant === 'login' || isRegister

  return (
    <div
      className={cn(
        'relative grid bg-gradient-hero',
        isMarketingCompact
          ? cn(
              'h-svh max-h-svh overflow-hidden',
              isRegister
                ? 'grid-rows-[minmax(0,1fr)_auto]'
                : 'grid-rows-[auto_minmax(0,1fr)_auto]',
            )
          : 'min-h-svh grid-rows-[1fr_auto] overflow-x-hidden overflow-y-auto',
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.55),transparent_70%)]" />

      <div
        className={cn(
          'relative z-0 row-start-1 px-4 pb-0 pt-[max(0.75rem,env(safe-area-inset-top))]',
          isMarketingCompact ? (isRegister ? 'flex min-h-0 flex-col justify-end pb-1' : 'pb-1') : 'flex flex-col pb-2',
          !isMarketingCompact && 'flex min-h-0 items-center justify-center',
        )}
      >
        <AuthMarketingHero
          variant={variant}
          compact={isMarketingCompact}
          className={cn(
            isMarketingCompact ? (isRegister ? 'py-0' : 'py-1') : 'py-2',
          )}
        />
      </div>

      {isMarketingCompact && !isRegister ? (
        <div aria-hidden className="row-start-2 min-h-0" />
      ) : null}

      <div
        className={cn(
          'relative z-20 rounded-t-[1.75rem] border border-border/60 bg-background/95 px-5 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] backdrop-blur-md',
          isMarketingCompact
            ? cn(
                'min-h-0 overflow-hidden',
                isRegister
                  ? 'row-start-2 -mt-4 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2'
                  : 'row-start-3 -mt-6 overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4',
              )
            : 'row-start-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4',
          className,
        )}
      >
        <div className={cn('mx-auto rounded-full bg-border', isRegister ? 'mb-2 h-1 w-8' : 'mb-3 h-1 w-10')} />
        <div className={cn('space-y-1', isRegister ? 'mb-2.5' : 'mb-4')}>
          <h2
            className={cn(
              'font-display font-black text-foreground',
              isRegister ? 'text-lg' : 'text-xl',
            )}
          >
            {sheetTitle}
          </h2>
          {sheetDescription ? (
            <p className="text-sm text-muted-foreground">{sheetDescription}</p>
          ) : null}
        </div>

        {children}
        {footer ? <div className={isRegister ? 'mt-2.5' : 'mt-4'}>{footer}</div> : null}
      </div>
    </div>
  )
}

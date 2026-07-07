import { Link } from '@tanstack/react-router'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type HomeSummaryTileProps = {
  to: string
  search?: Record<string, string>
  ariaLabel: string
  icon: LucideIcon
  title: string
  headerAddon?: ReactNode
  iconClassName?: string
  children: ReactNode
  className?: string
}

export function HomeSummaryTile({
  to,
  search,
  ariaLabel,
  icon: Icon,
  title,
  headerAddon,
  iconClassName,
  children,
  className,
}: HomeSummaryTileProps) {
  return (
    <Link
      to={to}
      search={search}
      className={cn(
        'block rounded-2xl border border-border/60 bg-card px-4 py-3.5 shadow-sm',
        'transition-colors active:bg-muted/30',
        className,
      )}
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full',
              iconClassName,
            )}
          >
            <Icon className="size-4" aria-hidden />
          </div>
          <p className="font-display text-sm font-bold text-foreground">{title}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {headerAddon}
          <ChevronRight className="size-4 text-muted-foreground/80" aria-hidden />
        </div>
      </div>

      <div className="mt-3">{children}</div>
    </Link>
  )
}

type HomeSummaryMetricProps = {
  value: string
  label: string
  tone?: 'default' | 'accent' | 'danger'
  className?: string
}

export function HomeSummaryMetric({
  value,
  label,
  tone = 'default',
  className,
}: HomeSummaryMetricProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className={cn('leading-none', className)}>
        <span
          className={cn(
            'font-display text-[1.65rem] font-black tabular-nums tracking-tight',
            tone === 'accent' && 'text-emerald-800 dark:text-emerald-300',
            tone === 'danger' && 'text-destructive',
            tone === 'default' && 'text-foreground',
          )}
        >
          {value}
        </span>
        <span className="ml-1 text-sm font-normal text-muted-foreground">{label}</span>
      </p>
    </div>
  )
}

export function HomeSummaryMetricDivider({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center px-1 text-muted-foreground/70',
        className,
      )}
      aria-hidden
    >
      {children}
    </div>
  )
}

export function HomeSummaryMetricsRow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-end justify-between gap-2', className)}>{children}</div>
  )
}

export function HomeSummaryTileFooter({
  left,
  right,
  className,
}: {
  left: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mt-2.5 flex items-center justify-between gap-3 text-xs text-muted-foreground',
        className,
      )}
    >
      <span>{left}</span>
      {right ? (
        <span className="shrink-0 text-right font-bold text-emerald-800 dark:text-emerald-300">
          {right}
        </span>
      ) : null}
    </div>
  )
}

export function HomeSummaryProgress({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  return (
    <Progress
      value={value}
      className={cn(
        'mt-3 h-2.5 bg-muted/45',
        '[&_[data-slot=progress-indicator]]:bg-emerald-500',
        className,
      )}
    />
  )
}

export function HomeSummaryTileSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="h-7 w-28 animate-pulse rounded bg-muted" />
        <div className="h-7 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-2.5 animate-pulse rounded-full bg-muted" />
      <div className="h-3 w-full animate-pulse rounded bg-muted" />
    </div>
  )
}

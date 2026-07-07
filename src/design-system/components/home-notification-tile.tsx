import { ChevronRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Theme-safe warning surface (sports-candy light/dark + pro). Uses existing CSS vars only. */
const warningSurfaceClass =
  'border border-[var(--nutrient-warning-border)] bg-[color-mix(in_srgb,var(--soft-accent)_72%,var(--nutrient-warning-bg))]'

const toneStyles = {
  warning: {
    container: cn(warningSurfaceClass, 'shadow-sm active:opacity-95'),
    iconWrap:
      'bg-[color-mix(in_srgb,var(--soft-peach)_82%,var(--nutrient-warning-bg))] text-[var(--nutrient-warning-fg)]',
    eyebrow: 'font-body text-[11px] font-semibold uppercase tracking-wide text-[var(--nutrient-warning-fg)]',
    title: 'font-body text-sm font-bold leading-snug text-foreground',
    action: 'font-body text-xs font-medium text-[var(--nutrient-warning-fg)]',
  },
  primary: {
    container:
      'border border-primary/35 bg-gradient-to-br from-soft-primary via-card to-soft-accent shadow-sm active:scale-[0.99]',
    iconWrap: 'bg-primary/15 text-primary',
    eyebrow: 'font-body text-[11px] font-bold uppercase tracking-wide text-primary',
    title: 'font-display text-sm font-black leading-snug text-foreground',
    action: 'font-body text-xs font-semibold text-primary',
  },
} as const

export type HomeNotificationTileTone = keyof typeof toneStyles

type HomeNotificationTileProps = {
  tone?: HomeNotificationTileTone
  eyebrow: string
  title: string
  actionLabel?: string
  actionIcon?: LucideIcon
  icon: LucideIcon
  onClick: () => void
  ariaLabel: string
  trailing?: ReactNode
  className?: string
}

export function HomeNotificationTile({
  tone = 'warning',
  eyebrow,
  title,
  actionLabel,
  actionIcon: ActionIcon,
  icon: Icon,
  onClick,
  ariaLabel,
  trailing,
  className,
}: HomeNotificationTileProps) {
  const styles = toneStyles[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'block w-full rounded-2xl px-4 py-4 text-left transition-transform',
        styles.container,
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full',
            styles.iconWrap,
          )}
        >
          <Icon className="size-[18px]" strokeWidth={2} aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className={styles.eyebrow}>{eyebrow}</p>
          <p className={cn('mt-0.5', styles.title)}>{title}</p>
          {actionLabel ? (
            <p className={cn('mt-2 flex items-center gap-1.5', styles.action)}>
              {ActionIcon ? (
                <ActionIcon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
              ) : null}
              {actionLabel}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1 self-center pl-0.5">
          {trailing}
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </div>
      </div>
    </button>
  )
}

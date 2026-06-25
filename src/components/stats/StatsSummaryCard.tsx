import { cn } from '@/lib/utils'

type StatsSummaryCardProps = {
  icon: React.ReactNode
  value: string
  label: string
  sub?: string
  tone?: 'primary' | 'secondary' | 'accent' | 'purple'
  className?: string
}

const toneClasses: Record<NonNullable<StatsSummaryCardProps['tone']>, string> = {
  primary: 'bg-soft-primary',
  secondary: 'bg-soft-secondary',
  accent: 'bg-soft-accent',
  purple: 'bg-soft-purple',
}

const iconWrapClasses: Record<NonNullable<StatsSummaryCardProps['tone']>, string> = {
  primary:
    'bg-primary/15 ring-1 ring-primary/30 dark:bg-primary/30 dark:ring-primary/55',
  secondary:
    'bg-secondary-foreground/12 ring-1 ring-secondary-foreground/28 dark:bg-secondary-foreground/20 dark:ring-secondary-foreground/55',
  accent:
    'bg-accent/20 ring-1 ring-accent/35 dark:bg-accent/30 dark:ring-accent/55',
  purple:
    'bg-[#6b4fcc]/12 ring-1 ring-[#6b4fcc]/30 dark:bg-[#6b4fcc]/22 dark:ring-[#6b4fcc]/55',
}

export function StatsSummaryCard({
  icon,
  value,
  label,
  sub,
  tone = 'primary',
  className,
}: StatsSummaryCardProps) {
  return (
    <div className={cn('flex flex-col gap-2 rounded-2xl p-4', toneClasses[tone], className)}>
      <div
        className={cn(
          'flex size-9 items-center justify-center rounded-xl',
          iconWrapClasses[tone],
        )}
      >
        {icon}
      </div>
      <div className="font-display text-2xl leading-none font-black text-foreground">
        {value}
      </div>
      <div className="text-sm font-semibold text-foreground/70">{label}</div>
      {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  )
}

import { cn } from '@/lib/utils'

type PillProps = {
  children: React.ReactNode
  className?: string
  tone?: 'default' | 'primary' | 'secondary' | 'accent' | 'purple' | 'streak' | 'solid-primary' | 'solid-secondary' | 'solid-accent' | 'solid-purple' | 'solid-gold'
  onClick?: () => void
}

const toneClasses: Record<NonNullable<PillProps['tone']>, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-soft-primary text-soft-primary-fg',
  secondary: 'bg-soft-secondary text-soft-secondary-fg',
  accent: 'bg-soft-accent text-soft-accent-fg',
  purple: 'bg-soft-purple text-soft-purple-fg',
  streak: 'bg-nutrition-streak text-nutrition-streak-foreground shadow-sm',
  'solid-primary': 'bg-primary text-primary-foreground shadow-soft-primary',
  'solid-secondary': 'bg-secondary text-secondary-foreground shadow-sm',
  'solid-accent': 'bg-accent text-accent-foreground shadow-soft-accent',
  'solid-purple': 'bg-workout-streak text-workout-streak-foreground shadow-sm',
  'solid-gold':
    'border border-amber-300/60 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 shadow-sm shadow-amber-500/25',
}

export function Pill({
  children,
  className,
  tone = 'default',
  onClick,
}: PillProps) {
  const classes = cn(
    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
    toneClasses[tone],
    onClick && 'cursor-pointer transition-opacity hover:opacity-90 active:opacity-80',
    className,
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {children}
      </button>
    )
  }

  return (
    <span className={classes}>
      {children}
    </span>
  )
}

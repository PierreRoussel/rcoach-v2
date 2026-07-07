import { cn } from '@/lib/utils'

type PillProps = {
  children: React.ReactNode
  className?: string
  tone?: 'default' | 'primary' | 'secondary' | 'accent' | 'purple' | 'solid-primary' | 'solid-accent' | 'solid-purple'
  onClick?: () => void
}

const toneClasses: Record<NonNullable<PillProps['tone']>, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-soft-primary text-soft-primary-fg',
  secondary: 'bg-soft-secondary text-soft-secondary-fg',
  accent: 'bg-soft-accent text-soft-accent-fg',
  purple: 'bg-soft-purple text-[#6b4fcc]',
  'solid-primary': 'bg-primary text-primary-foreground shadow-soft-primary',
  'solid-accent': 'bg-accent text-accent-foreground shadow-soft-accent',
  'solid-purple': 'bg-[#6b4fcc] text-white shadow-sm',
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

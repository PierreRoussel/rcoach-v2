import { cn } from '@/lib/utils'

type PillProps = {
  children: React.ReactNode
  className?: string
  tone?: 'default' | 'primary' | 'secondary' | 'accent' | 'purple' | 'solid-primary'
}

const toneClasses: Record<NonNullable<PillProps['tone']>, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-soft-primary text-primary',
  secondary: 'bg-soft-secondary text-secondary-foreground',
  accent: 'bg-soft-accent text-accent-foreground',
  purple: 'bg-soft-purple text-[#6b4fcc]',
  'solid-primary': 'bg-primary text-primary-foreground shadow-soft-primary',
}

export function Pill({
  children,
  className,
  tone = 'default',
}: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

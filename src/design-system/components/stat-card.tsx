import { cn } from '@/lib/utils'

type StatCardProps = {
  icon: React.ReactNode
  value: string
  label: string
  sub?: string
  tone?: 'primary' | 'secondary' | 'accent' | 'purple'
  className?: string
}

const toneClasses: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: 'bg-soft-primary',
  secondary: 'bg-soft-secondary',
  accent: 'bg-soft-accent',
  purple: 'bg-soft-purple',
}

export function StatCard({
  icon,
  value,
  label,
  sub,
  tone = 'primary',
  className,
}: StatCardProps) {
  return (
    <div className={cn('flex flex-col gap-2 rounded-2xl p-4', toneClasses[tone], className)}>
      <div className="flex size-9 items-center justify-center rounded-xl bg-white/60">
        {icon}
      </div>
      <div className="font-display text-2xl leading-none font-black text-foreground">
        {value}
      </div>
      <div className="text-sm font-semibold text-foreground/70">{label}</div>
      {sub ? <div className="text-xs text-foreground/65">{sub}</div> : null}
    </div>
  )
}

import { Users } from 'lucide-react'

import { formatBadgeUnlockStat } from '@/lib/gamification/badges'
import { cn } from '@/lib/utils'

type BadgeUnlockStatProps = {
  percent: number
  className?: string
  centered?: boolean
}

export function BadgeUnlockStat({ percent, className, centered = false }: BadgeUnlockStatProps) {
  return (
    <p
      className={cn(
        'flex items-center gap-1.5 text-sm text-muted-foreground',
        centered && 'justify-center',
        className,
      )}
    >
      <Users className="size-3.5 shrink-0" aria-hidden />
      <span>{formatBadgeUnlockStat(percent)}</span>
    </p>
  )
}

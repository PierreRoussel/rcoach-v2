import { Snowflake } from 'lucide-react'

import { Pill } from '@/design-system/components/pill'
import { cn } from '@/lib/utils'

type FrozenBadgeProps = {
  className?: string
}

export function FrozenBadge({ className }: FrozenBadgeProps) {
  return (
    <Pill tone="default" className={cn('gap-1 shadow-sm', className)}>
      <Snowflake className="size-3 text-sky-400" aria-hidden />
      <span className="text-[10px] font-medium text-muted-foreground">gelé</span>
    </Pill>
  )
}

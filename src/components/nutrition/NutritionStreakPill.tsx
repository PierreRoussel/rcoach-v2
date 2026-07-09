import { Flame, Snowflake } from 'lucide-react'

import { Pill } from '@/design-system'
import { cn } from '@/lib/utils'

type NutritionStreakPillProps = {
  streak: number
  isFrozen?: boolean
  className?: string
  format?: 'full' | 'compact' | 'count'
  showFrozenLabel?: boolean
  title?: string
}

function formatStreakLabel(
  streak: number,
  format: NutritionStreakPillProps['format'],
  isFrozen: boolean,
  showFrozenLabel: boolean,
) {
  if (format === 'count') {
    return String(streak)
  }

  if (format === 'compact') {
    return `${streak} j.`
  }

  return (
    <>
      {streak} jour{streak > 1 ? 's' : ''}
      {isFrozen && showFrozenLabel ? (
        <span className="font-medium text-muted-foreground">gelé</span>
      ) : null}
    </>
  )
}

export function NutritionStreakPill({
  streak,
  isFrozen = false,
  className,
  format = 'full',
  showFrozenLabel = true,
  title,
}: NutritionStreakPillProps) {
  const pill = (
    <Pill tone={isFrozen ? 'default' : 'streak'} className={cn('gap-1.5', className)}>
      {isFrozen ? (
        <Snowflake className="size-3.5 shrink-0 text-sky-500" aria-hidden />
      ) : (
        <Flame className="size-3.5 shrink-0 fill-current" aria-hidden />
      )}
      {formatStreakLabel(streak, format, isFrozen, showFrozenLabel)}
    </Pill>
  )

  if (!title) {
    return pill
  }

  return <span title={title}>{pill}</span>
}

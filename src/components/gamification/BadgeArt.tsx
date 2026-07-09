import type { LucideIcon } from 'lucide-react'

import { getBadgeTileSrc } from '@/lib/gamification/badge-assets'
import { cn } from '@/lib/utils'

type BadgeArtProps = {
  badgeKey: string
  icon: LucideIcon
  className?: string
  imageClassName?: string
  iconClassName?: string
}

export function BadgeArt({
  badgeKey,
  icon: Icon,
  className,
  imageClassName,
  iconClassName,
}: BadgeArtProps) {
  const tileSrc = getBadgeTileSrc(badgeKey)

  if (tileSrc) {
    return (
      <img
        src={tileSrc}
        alt=""
        aria-hidden
        className={cn('shrink-0 object-contain', imageClassName, className)}
      />
    )
  }

  return <Icon className={cn(iconClassName, className)} aria-hidden />
}

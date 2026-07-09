import { useState } from 'react'

import { BadgeArt } from '@/components/gamification/BadgeArt'
import { BadgeDetailDrawer } from '@/components/gamification/BadgeDetailDrawer'
import type { BadgeShelfItem } from '@/hooks/useBadges'
import { cn } from '@/lib/utils'

type FriendProfileBadgeRowProps = {
  items: BadgeShelfItem[]
  isLoading?: boolean
}

export function FriendProfileBadgeRow({ items, isLoading = false }: FriendProfileBadgeRowProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeShelfItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const unlockedItems = items.filter((item) => item.unlocked)

  function openBadgeDetail(item: BadgeShelfItem) {
    setSelectedBadge(item)
    setDrawerOpen(true)
  }

  function handleDrawerOpenChange(open: boolean) {
    setDrawerOpen(open)
    if (!open) {
      setSelectedBadge(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex divide-x divide-border/50">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex min-w-[33.333%] flex-1 items-center justify-center py-2"
          >
            <div className="size-12 animate-pulse rounded-full bg-muted-foreground/15" />
          </div>
        ))}
      </div>
    )
  }

  if (unlockedItems.length === 0) {
    return null
  }

  return (
    <>
      <div className="flex divide-x divide-border/50 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {unlockedItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={cn(
              'flex min-w-[33.333%] flex-1 items-center justify-center py-2 transition',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            )}
            aria-label={`${item.label}, débloquée`}
            onClick={() => openBadgeDetail(item)}
          >
            <span className="flex size-12 items-center justify-center overflow-hidden rounded-full">
              <BadgeArt
                badgeKey={item.key}
                icon={item.icon}
                imageClassName="size-12 rounded-full object-cover"
                iconClassName="size-6"
              />
            </span>
          </button>
        ))}
      </div>

      <BadgeDetailDrawer
        badge={selectedBadge}
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
      />
    </>
  )
}

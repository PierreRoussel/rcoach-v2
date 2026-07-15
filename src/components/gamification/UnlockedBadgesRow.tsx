import { useState } from 'react'
import { Medal } from 'lucide-react'

import { BadgeArt } from '@/components/gamification/BadgeArt'
import { BadgeDetailDrawer } from '@/components/gamification/BadgeDetailDrawer'
import type { BadgeShelfItem } from '@/hooks/useBadges'
import { cn } from '@/lib/utils'

type UnlockedBadgesRowProps = {
  items: BadgeShelfItem[]
  isLoading?: boolean
  /** Masquer la ligne si vide (ami) ou afficher 3 emplacements vides (profil perso). */
  whenEmpty?: 'hide' | 'placeholders'
}

export function UnlockedBadgesRow({
  items,
  isLoading = false,
  whenEmpty = 'hide',
}: UnlockedBadgesRowProps) {
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
    if (whenEmpty === 'hide') {
      return null
    }

    return (
      <div className="space-y-2.5">
        <div
          className="flex overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-b from-primary/[0.06] via-card/30 to-card/10 shadow-sm ring-1 ring-inset ring-white/50"
          role="group"
          aria-label="Emplacements de médailles vides"
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'flex min-w-[33.333%] flex-1 flex-col items-center justify-center py-3.5',
                index > 0 && 'border-l border-primary/10',
              )}
              aria-hidden={index > 0}
            >
              <span className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-primary/30 bg-background/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
                <Medal
                  className="size-6 text-primary/45"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-[11px] font-medium leading-snug text-muted-foreground">
          Vos prochaines médailles apparaîtront ici
        </p>
      </div>
    )
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

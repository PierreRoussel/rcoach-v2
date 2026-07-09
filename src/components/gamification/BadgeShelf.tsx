import { useState } from 'react'

import { BadgeArt } from '@/components/gamification/BadgeArt'
import { BadgeDetailDrawer } from '@/components/gamification/BadgeDetailDrawer'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BADGE_TIER_CLASSES } from '@/lib/gamification/badges'
import { hasBadgeAsset } from '@/lib/gamification/badge-assets'
import type { BadgeShelfItem } from '@/hooks/useBadges'
import { cn } from '@/lib/utils'

type BadgeShelfProps = {
  items: BadgeShelfItem[]
  title?: string
  description?: string
  compact?: boolean
  unlockedOnly?: boolean
  embedded?: boolean
  emptyMessage?: string
}

export function BadgeShelf({
  items,
  title = 'Médailles',
  description = 'Vos accomplissements discipline, records et volume.',
  compact = false,
  unlockedOnly = false,
  embedded = false,
  emptyMessage = 'Aucune médaille débloquée pour le moment.',
}: BadgeShelfProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeShelfItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const visibleItems = unlockedOnly ? items.filter((item) => item.unlocked) : items
  const unlockedCount = items.filter((item) => item.unlocked).length

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

  const grid = (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {visibleItems.map((item) => {
        const usesCustomArt = hasBadgeAsset(item.key)

        return (
          <button
            key={item.key}
            type="button"
            className={cn(
              'flex flex-col items-center gap-1 rounded-2xl border p-2 text-center transition',
              'cursor-pointer hover:scale-[1.02] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              item.unlocked
                ? usesCustomArt
                  ? 'border-border/70 bg-card'
                  : BADGE_TIER_CLASSES[item.tier]
                : 'border-border bg-muted/30 opacity-45 grayscale hover:opacity-60',
            )}
            aria-label={
              item.unlocked
                ? `${item.label}, débloquée — voir les détails`
                : `${item.label}, verrouillée — voir comment l’obtenir`
            }
            onClick={() => openBadgeDetail(item)}
          >
            <span
              className={cn(
                'flex items-center justify-center',
                      usesCustomArt ? 'size-16' : 'size-10 rounded-full border',
                !usesCustomArt &&
                  (item.unlocked
                    ? 'border-current/20 bg-white/40'
                    : 'border-border bg-card'),
              )}
            >
              <BadgeArt
                badgeKey={item.key}
                icon={item.icon}
                      imageClassName="size-16"
                iconClassName="size-4"
              />
            </span>
            <p className="line-clamp-2 text-xs font-bold leading-tight">{item.label}</p>
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      {embedded ? (
        <div className="space-y-2">
          {title ? (
            <div>
              <h3 className="font-display text-sm font-black">{title}</h3>
              {description ? (
                <p className="text-xs text-muted-foreground">
                  {description}
                  {unlockedOnly
                    ? ` ${visibleItems.length} débloquée(s).`
                    : ` ${unlockedCount}/${items.length} débloquée(s).`}
                </p>
              ) : null}
            </div>
          ) : null}
          {visibleItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            grid
          )}
        </div>
      ) : (
        <Card className="rounded-2xl border-border">
          <CardHeader className={compact ? 'pb-2' : undefined}>
            <CardTitle className="font-display font-black">{title}</CardTitle>
            <CardDescription>
              {description} {unlockedCount}/{items.length} débloquée(s).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {visibleItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              grid
            )}
          </CardContent>
        </Card>
      )}

      <BadgeDetailDrawer
        badge={selectedBadge}
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
      />
    </>
  )
}

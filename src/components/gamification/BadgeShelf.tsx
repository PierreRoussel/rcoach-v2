import { useState } from 'react'

import { BadgeDetailDrawer } from '@/components/gamification/BadgeDetailDrawer'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BADGE_TIER_CLASSES } from '@/lib/gamification/badges'
import type { BadgeShelfItem } from '@/hooks/useBadges'
import { cn } from '@/lib/utils'

type BadgeShelfProps = {
  items: BadgeShelfItem[]
  title?: string
  description?: string
  compact?: boolean
}

export function BadgeShelf({
  items,
  title = 'Médailles',
  description = 'Vos accomplissements discipline, records et volume.',
  compact = false,
}: BadgeShelfProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeShelfItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
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

  return (
    <>
      <Card className="rounded-2xl border-border">
        <CardHeader className={compact ? 'pb-2' : undefined}>
          <CardTitle className="font-display font-black">{title}</CardTitle>
          <CardDescription>
            {description} {unlockedCount}/{items.length} débloquée(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((item) => {
              const Icon = item.icon

              return (
                <button
                  key={item.key}
                  type="button"
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-2xl border p-2 text-center transition',
                    'cursor-pointer hover:scale-[1.02] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    item.unlocked
                      ? BADGE_TIER_CLASSES[item.tier]
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
                      'flex size-10 items-center justify-center rounded-full border',
                      item.unlocked ? 'border-current/20 bg-white/40' : 'border-border bg-card',
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <p className="line-clamp-2 text-[10px] font-bold leading-tight">{item.label}</p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <BadgeDetailDrawer
        badge={selectedBadge}
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
      />
    </>
  )
}

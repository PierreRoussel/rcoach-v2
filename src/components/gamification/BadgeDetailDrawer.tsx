import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarCheck, Lock, Sparkles } from 'lucide-react'

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Pill } from '@/design-system'
import type { BadgeShelfItem } from '@/hooks/useBadges'
import {
  BADGE_TIER_CLASSES,
  describeBadgeUnlockCondition,
  getBadgeCategoryLabel,
  getBadgeTierLabel,
} from '@/lib/gamification/badges'
import { cn } from '@/lib/utils'

type BadgeDetailDrawerProps = {
  badge: BadgeShelfItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BadgeDetailDrawer({ badge, open, onOpenChange }: BadgeDetailDrawerProps) {
  if (!badge) {
    return null
  }

  const Icon = badge.icon
  const unlockCondition = describeBadgeUnlockCondition(badge)

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] rounded-t-3xl">
        <DrawerHeader className="text-center">
          <DrawerTitle className="sr-only">{badge.label}</DrawerTitle>
          <DrawerDescription className="sr-only">{badge.description}</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-5 px-4 pb-8 pt-2">
          <div
            className={cn(
              'mx-auto flex max-w-xs flex-col items-center gap-3 rounded-3xl border p-6 text-center',
              badge.unlocked
                ? BADGE_TIER_CLASSES[badge.tier]
                : 'border-border bg-muted/30 text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex size-24 items-center justify-center rounded-full border',
                badge.unlocked
                  ? 'border-current/20 bg-white/50'
                  : 'border-border bg-card opacity-70 grayscale',
              )}
            >
              <Icon className="size-12" aria-hidden />
            </span>
            <div>
              <p className="font-display text-2xl font-black">{badge.label}</p>
              <p className="mt-1 text-sm">{badge.description}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              <Pill tone="secondary">{getBadgeCategoryLabel(badge.category)}</Pill>
              <Pill tone="secondary">{getBadgeTierLabel(badge.tier)}</Pill>
            </div>
          </div>

          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden />
              <h3 className="font-display text-sm font-black">Comment l’obtenir</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{unlockCondition}</p>
          </section>

          <section
            className={cn(
              'rounded-2xl border p-4',
              badge.unlocked
                ? 'border-primary/20 bg-primary/5'
                : 'border-border bg-muted/20',
            )}
          >
            {badge.unlocked && badge.unlockedAt ? (
              <>
                <div className="flex items-center gap-2">
                  <CalendarCheck className="size-4 text-primary" aria-hidden />
                  <h3 className="font-display text-sm font-black">Débloquée</h3>
                </div>
                <p className="mt-2 text-sm">
                  {format(new Date(badge.unlockedAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Lock className="size-4 text-muted-foreground" aria-hidden />
                  <h3 className="font-display text-sm font-black">Pas encore débloquée</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Continuez à progresser pour débloquer cette médaille.
                </p>
              </>
            )}
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

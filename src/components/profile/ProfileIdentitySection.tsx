import { useEffect, useMemo, useState } from 'react'

import { BadgeCatalogDrawer } from '@/components/gamification/BadgeCatalogDrawer'
import { BadgeUnlockOverlay } from '@/components/gamification/BadgeUnlockOverlay'
import { UnlockedBadgesRow } from '@/components/gamification/UnlockedBadgesRow'
import { WorkoutStreakIcon } from '@/components/schedule/WorkoutStreakIcon'
import { NutritionStreakPill } from '@/components/nutrition/NutritionStreakPill'
import { UserAvatar } from '@/components/profile/UserAvatar'
import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
import { useBadgeCatalog } from '@/hooks/useBadgeCatalog'
import {
  buildBadgeShelfItems,
  getUnlockedBadgeDefinitions,
  useMyBadges,
  useSyncMyBadges,
} from '@/hooks/useBadges'
import { useNutritionStreak } from '@/hooks/useNutritionStreak'
import { useMyProfile } from '@/hooks/useProfile'
import { useWorkoutWeeklyStreak } from '@/hooks/useWorkouts'

export function ProfileIdentitySection() {
  const { data: profile } = useMyProfile()
  const { data: badges = [], isLoading: badgesLoading } = useMyBadges()
  const { data: catalog = [] } = useBadgeCatalog()
  const syncBadges = useSyncMyBadges()
  const { streak: workoutStreak } = useWorkoutWeeklyStreak()
  const { streak: nutritionStreak } = useNutritionStreak()
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [newBadges, setNewBadges] = useState(
    () => [] as ReturnType<typeof getUnlockedBadgeDefinitions>,
  )

  const badgeItems = useMemo(
    () => buildBadgeShelfItems(badges, catalog),
    [badges, catalog],
  )

  useEffect(() => {
    void syncBadges.mutateAsync().then((keys) => {
      const unlocked = getUnlockedBadgeDefinitions(
        keys.map((key) => ({
          id: `optimistic-${key}`,
          user_id: '',
          badge_key: key,
          unlocked_at: new Date().toISOString(),
        })),
        catalog,
      )

      if (unlocked.length > 0) {
        setNewBadges(unlocked)
        setOverlayOpen(true)
      }
    })
    // Sync once when opening the profile hub.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!profile) {
    return (
      <section className="rounded-2xl bg-muted px-5 py-6">
        <p className="text-sm text-muted-foreground">Chargement du profil...</p>
      </section>
    )
  }

  return (
    <>
      <section className="rounded-2xl bg-muted px-5 py-5">
        <header className="flex items-start gap-3.5">
          <UserAvatar
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            isPremium={profile.is_premium ?? false}
            size="xl"
          />

          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="truncate font-display text-xl font-black leading-tight">
              {profile.display_name}
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill tone="secondary" className="gap-1 py-0.5 text-[10px]">
                <WorkoutStreakIcon className="size-3" />
                {workoutStreak} sem.
              </Pill>
              <NutritionStreakPill
                streak={nutritionStreak}
                format="compact"
                className="gap-1 py-0.5 text-[10px]"
              />
            </div>
          </div>
        </header>

        <div className="mt-5">
          <UnlockedBadgesRow
            items={badgeItems}
            isLoading={badgesLoading}
            whenEmpty="placeholders"
          />
        </div>

        <Button
          type="button"
          variant="soft"
          className="mt-4 w-full rounded-xl"
          onClick={() => setCatalogOpen(true)}
        >
          Voir les badges
        </Button>
      </section>

      <BadgeCatalogDrawer
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        items={badgeItems}
      />

      <BadgeUnlockOverlay
        badges={newBadges}
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
      />
    </>
  )
}

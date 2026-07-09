import { useEffect, useMemo, useState } from 'react'

import { BadgeShelf } from '@/components/gamification/BadgeShelf'
import { BadgeUnlockOverlay } from '@/components/gamification/BadgeUnlockOverlay'
import { useBadgeCatalog } from '@/hooks/useBadgeCatalog'
import {
  buildBadgeShelfItems,
  getUnlockedBadgeDefinitions,
  useMyBadges,
  useSyncMyBadges,
} from '@/hooks/useBadges'

export function ProfileBadgesSection() {
  const { data: badges = [], isLoading } = useMyBadges()
  const { data: catalog = [] } = useBadgeCatalog()
  const syncBadges = useSyncMyBadges()
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [newBadges, setNewBadges] = useState(
    () => [] as ReturnType<typeof getUnlockedBadgeDefinitions>,
  )

  const items = useMemo(
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

  if (isLoading && badges.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Chargement de vos médailles...</p>
    )
  }

  return (
    <>
      <BadgeShelf items={items} />
      <BadgeUnlockOverlay
        badges={newBadges}
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
      />
    </>
  )
}

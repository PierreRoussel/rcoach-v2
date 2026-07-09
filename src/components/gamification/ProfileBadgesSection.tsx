import { useEffect, useMemo, useState } from 'react'

import { BadgeShelf } from '@/components/gamification/BadgeShelf'
import { BadgeUnlockOverlay } from '@/components/gamification/BadgeUnlockOverlay'
import { buildBadgeShelfItems, useMyBadges, useSyncMyBadges } from '@/hooks/useBadges'
import { getBadgeDefinition } from '@/lib/gamification/badges'

export function ProfileBadgesSection() {
  const { data: badges = [], isLoading } = useMyBadges()
  const syncBadges = useSyncMyBadges()
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [newBadges, setNewBadges] = useState(
    () => [] as ReturnType<typeof getBadgeDefinition>[],
  )

  const items = useMemo(() => buildBadgeShelfItems(badges), [badges])

  useEffect(() => {
    void syncBadges.mutateAsync().then((keys) => {
      const unlocked = keys
        .map((key) => getBadgeDefinition(key))
        .filter((badge): badge is NonNullable<typeof badge> => badge != null)

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
        badges={newBadges.filter((badge): badge is NonNullable<typeof badge> => badge != null)}
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
      />
    </>
  )
}

import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FriendRecapRow } from '@/components/social/FriendRecapRow'
import { MotivationPickerDialog } from '@/components/social/MotivationPickerDialog'
import { MotivationRevealOverlay } from '@/components/social/MotivationRevealOverlay'
import { useFriendRecap } from '@/hooks/useFriends'
import type { FriendMotivation } from '@/lib/graphql/operations'

export function FriendsSection() {
  const { items, isLoading } = useFriendRecap(5)
  const [pickerFriend, setPickerFriend] = useState<{
    id: string
    name: string
  } | null>(null)
  const [activeMotivation, setActiveMotivation] = useState<FriendMotivation | null>(null)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement de vos amis...</p>
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-black">Mes amis</h2>
          <p className="text-xs text-muted-foreground">
            Streaks et encouragements de votre cercle.
          </p>
        </div>
        <Button variant="soft" size="sm" className="rounded-full" asChild>
          <Link to="/app/friends">Voir tout</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Ajoutez des amis pour suivre leurs streaks et leur envoyer des emojis.
          </p>
          <Button variant="pill" size="sm" className="mt-3" asChild>
            <Link to="/app/friends">Ajouter un ami</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <FriendRecapRow
              key={item.friendshipId}
              displayName={item.friend.display_name}
              avatarUrl={item.friend.avatar_url}
              activity={item.activity}
              unreadMotivation={item.unreadMotivation}
              onSendMotivation={() =>
                setPickerFriend({ id: item.friend.id, name: item.friend.display_name })
              }
              onOpenMotivation={() => {
                if (item.unreadMotivation) {
                  setActiveMotivation(item.unreadMotivation)
                }
              }}
            />
          ))}
        </div>
      )}

      <MotivationPickerDialog
        open={pickerFriend != null}
        onOpenChange={(open) => {
          if (!open) {
            setPickerFriend(null)
          }
        }}
        recipientId={pickerFriend?.id ?? ''}
        recipientName={pickerFriend?.name ?? ''}
      />

      <MotivationRevealOverlay
        motivation={activeMotivation}
        onClose={() => setActiveMotivation(null)}
      />
    </section>
  )
}

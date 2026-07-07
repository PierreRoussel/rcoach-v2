import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { FriendRecapRow } from '@/components/social/FriendRecapRow'
import { FriendRequestRow } from '@/components/social/FriendRequestRow'
import { MotivationPickerDialog } from '@/components/social/MotivationPickerDialog'
import { MotivationRevealOverlay } from '@/components/social/MotivationRevealOverlay'
import {
  useFriendRecap,
  usePendingIncomingFriendRequests,
  useRespondFriendRequest,
  useSentMotivations,
} from '@/hooks/useFriends'
import { getSentMotivationDisplay } from '@/lib/social/sent-motivation'
import type { MotivationNotification } from '@/lib/social/motivation-notifications'

export function FriendsSection() {
  const { items, isLoading } = useFriendRecap(5)
  const { pending, isLoading: pendingLoading } = usePendingIncomingFriendRequests()
  const respondRequest = useRespondFriendRequest()
  const { data: sentMotivations = [] } = useSentMotivations()
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [pickerFriend, setPickerFriend] = useState<{
    id: string
    name: string
  } | null>(null)
  const [activeNotification, setActiveNotification] = useState<MotivationNotification | null>(
    null,
  )

  async function handleRespond(friendshipId: string, accept: boolean) {
    setRespondingId(friendshipId)

    try {
      await respondRequest.mutateAsync({ friendshipId, accept })
    } finally {
      setRespondingId(null)
    }
  }

  if (isLoading || pendingLoading) {
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

      {pending.length > 0 ? (
        <div className="space-y-2">
          {pending.map((friendship) => {
            const requester = friendship.requester
            const name =
              requester?.display_name ?? friendship.invited_email ?? 'Utilisateur'

            return (
              <FriendRequestRow
                key={friendship.id}
                displayName={name}
                avatarUrl={requester?.avatar_url ?? null}
                isPremium={requester?.is_premium ?? false}
                isResponding={respondingId === friendship.id}
                onAccept={() => void handleRespond(friendship.id, true)}
                onDecline={() => void handleRespond(friendship.id, false)}
              />
            )
          })}
        </div>
      ) : null}

      {items.length === 0 && pending.length === 0 ? (
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
              isPremium={item.friend.is_premium ?? false}
              activity={item.activity}
              motivationNotification={item.motivationNotification}
              sentDisplay={getSentMotivationDisplay(sentMotivations, item.friend.id)}
              onSendMotivation={() =>
                setPickerFriend({ id: item.friend.id, name: item.friend.display_name })
              }
              onOpenMotivation={() => {
                if (item.motivationNotification) {
                  setActiveNotification(item.motivationNotification)
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
        notification={activeNotification}
        onClose={() => setActiveNotification(null)}
      />
    </section>
  )
}

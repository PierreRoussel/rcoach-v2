import type { Friendship, FriendMotivation, FriendProfileSummary } from '@/lib/graphql/operations'
import type { MotivationNotification } from '@/lib/social/motivation-notifications'
import { buildMotivationNotificationsByFriend } from '@/lib/social/motivation-notifications'

export function getFriendUserId(
  friendship: Friendship,
  currentUserId: string,
): string | null {
  if (friendship.requester_id === currentUserId) {
    return friendship.addressee_id
  }
  if (friendship.addressee_id === currentUserId) {
    return friendship.requester_id
  }
  return null
}

export function getFriendProfile(
  friendship: Friendship,
  currentUserId: string,
): FriendProfileSummary | null {
  if (friendship.requester_id === currentUserId) {
    return friendship.addressee ?? null
  }
  if (friendship.addressee_id === currentUserId) {
    return friendship.requester ?? null
  }
  return null
}

export type FriendRecapItem = {
  friendshipId: string
  friend: FriendProfileSummary
  motivationNotification: MotivationNotification | null
}

export function buildFriendRecapList(
  friendships: Friendship[],
  incomingUnread: FriendMotivation[],
  unseenHeartReplies: FriendMotivation[],
  currentUserId: string,
  limit = 5,
): FriendRecapItem[] {
  const notificationsByFriend = buildMotivationNotificationsByFriend(
    incomingUnread,
    unseenHeartReplies,
  )

  const items = friendships
    .map((friendship) => {
      const friend = getFriendProfile(friendship, currentUserId)
      if (!friend) {
        return null
      }

      return {
        friendshipId: friendship.id,
        friend,
        motivationNotification: notificationsByFriend.get(friend.id) ?? null,
      }
    })
    .filter((item): item is FriendRecapItem => item != null)

  items.sort((left, right) => {
    const leftUnread = left.motivationNotification ? 1 : 0
    const rightUnread = right.motivationNotification ? 1 : 0
    if (leftUnread !== rightUnread) {
      return rightUnread - leftUnread
    }

    return left.friend.display_name.localeCompare(right.friend.display_name, 'fr')
  })

  return items.slice(0, limit)
}

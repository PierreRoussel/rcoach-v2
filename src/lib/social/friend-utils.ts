import type { Friendship, FriendMotivation, FriendProfileSummary } from '@/lib/graphql/operations'

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
  unreadMotivation: FriendMotivation | null
}

export function buildFriendRecapList(
  friendships: Friendship[],
  unreadMotivations: FriendMotivation[],
  currentUserId: string,
  limit = 5,
): FriendRecapItem[] {
  const unreadBySender = new Map<string, FriendMotivation>()
  for (const motivation of unreadMotivations) {
    if (!unreadBySender.has(motivation.sender_id)) {
      unreadBySender.set(motivation.sender_id, motivation)
    }
  }

  const items = friendships
    .map((friendship) => {
      const friend = getFriendProfile(friendship, currentUserId)
      if (!friend) {
        return null
      }

      return {
        friendshipId: friendship.id,
        friend,
        unreadMotivation: unreadBySender.get(friend.id) ?? null,
      }
    })
    .filter((item): item is FriendRecapItem => item != null)

  items.sort((left, right) => {
    const leftUnread = left.unreadMotivation ? 1 : 0
    const rightUnread = right.unreadMotivation ? 1 : 0
    if (leftUnread !== rightUnread) {
      return rightUnread - leftUnread
    }

    return left.friend.display_name.localeCompare(right.friend.display_name, 'fr')
  })

  return items.slice(0, limit)
}

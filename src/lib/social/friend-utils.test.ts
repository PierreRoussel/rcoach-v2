import { describe, expect, it } from 'vitest'

import type { Friendship, FriendMotivation } from '@/lib/graphql/operations'
import { buildFriendRecapList } from '@/lib/social/friend-utils'

const friendA = {
  id: 'friend-a',
  display_name: 'Alice',
  avatar_url: null,
  workouts: [],
  meal_log_entries: [],
}

const friendB = {
  id: 'friend-b',
  display_name: 'Bob',
  avatar_url: null,
  workouts: [],
  meal_log_entries: [],
}

function friendship(
  id: string,
  requesterId: string,
  addresseeId: string,
  friend: typeof friendA,
): Friendship {
  return {
    id,
    requester_id: requesterId,
    addressee_id: addresseeId,
    invited_email: null,
    status: 'accepted',
    created_at: '2026-06-01T00:00:00Z',
    requester: requesterId === 'me' ? undefined : friend,
    addressee: addresseeId === 'me' ? undefined : friend,
  }
}

function unreadFrom(senderId: string): FriendMotivation {
  return {
    id: `motivation-${senderId}`,
    sender_id: senderId,
    recipient_id: 'me',
    emoji: '🔥',
    message: 'Go !',
    preset_key: 'fire',
    read_at: null,
    hearted_at: null,
    reply_message: null,
    created_at: '2026-06-25T00:00:00Z',
  }
}

describe('buildFriendRecapList', () => {
  it('prioritizes friends with unread motivations', () => {
    const friendships = [
      friendship('f1', 'me', 'friend-a', friendA),
      friendship('f2', 'friend-b', 'me', friendB),
    ]

    const recap = buildFriendRecapList(
      friendships,
      [unreadFrom('friend-b')],
      'me',
      5,
    )

    expect(recap.map((item) => item.friend.id)).toEqual(['friend-b', 'friend-a'])
    expect(recap[0]?.unreadMotivation?.sender_id).toBe('friend-b')
  })

  it('limits the number of friends shown', () => {
    const friendships = [
      friendship('f1', 'me', 'friend-a', friendA),
      friendship('f2', 'me', 'friend-b', friendB),
    ]

    const recap = buildFriendRecapList(friendships, [], 'me', 1)
    expect(recap).toHaveLength(1)
  })
})

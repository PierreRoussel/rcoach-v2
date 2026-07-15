import type { FriendMotivation } from '@/lib/graphql/operations'

export type MotivationNotification =
  | {
      kind: 'received'
      motivation: FriendMotivation
      friendId: string
      bannerEmoji: string
      bannerLabel: string
    }
  | {
      kind: 'heart_reply'
      motivation: FriendMotivation
      friendId: string
      bannerEmoji: string
      bannerLabel: string
    }

function notificationTimestamp(notification: MotivationNotification): string {
  if (notification.kind === 'heart_reply') {
    return notification.motivation.hearted_at ?? notification.motivation.created_at
  }

  return notification.motivation.created_at
}

export function buildMotivationNotificationsByFriend(
  incomingUnread: FriendMotivation[],
  unseenHeartReplies: FriendMotivation[],
): Map<string, MotivationNotification> {
  const byFriend = new Map<string, MotivationNotification>()

  for (const motivation of incomingUnread) {
    byFriend.set(motivation.sender_id, {
      kind: 'received',
      motivation,
      friendId: motivation.sender_id,
      bannerEmoji: motivation.emoji,
      bannerLabel: 'Nouveau message de motivation',
    })
  }

  for (const motivation of unseenHeartReplies) {
    const friendName = motivation.recipient?.display_name ?? 'Un ami'
    const notification: MotivationNotification = {
      kind: 'heart_reply',
      motivation,
      friendId: motivation.recipient_id,
      bannerEmoji: '❤️',
      bannerLabel: `${friendName} répond à votre emoji`,
    }

    const existing = byFriend.get(motivation.recipient_id)
    if (!existing) {
      byFriend.set(motivation.recipient_id, notification)
      continue
    }

    if (notificationTimestamp(notification) > notificationTimestamp(existing)) {
      byFriend.set(motivation.recipient_id, notification)
    }
  }

  return byFriend
}

export function toReceivedMotivationNotification(
  motivation: FriendMotivation,
): MotivationNotification {
  return {
    kind: 'received',
    motivation,
    friendId: motivation.sender_id,
    bannerEmoji: motivation.emoji,
    bannerLabel: 'Nouveau message de motivation',
  }
}

export function buildHomeMotivationNotifications(
  incomingUnread: FriendMotivation[],
  unseenHeartReplies: FriendMotivation[],
): MotivationNotification[] {
  return [...buildMotivationNotificationsByFriend(incomingUnread, unseenHeartReplies).values()].sort(
    (left, right) => notificationTimestamp(right).localeCompare(notificationTimestamp(left)),
  )
}


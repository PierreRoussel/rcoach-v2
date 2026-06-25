import type { FriendMotivation } from '@/lib/graphql/operations'

export type SentMotivationDisplay = {
  motivation: FriendMotivation
  isRead: boolean
}

export function buildLatestSentByRecipient(
  motivations: FriendMotivation[],
): Map<string, FriendMotivation> {
  const latestByRecipient = new Map<string, FriendMotivation>()

  for (const motivation of motivations) {
    const existing = latestByRecipient.get(motivation.recipient_id)
    if (!existing || motivation.created_at > existing.created_at) {
      latestByRecipient.set(motivation.recipient_id, motivation)
    }
  }

  return latestByRecipient
}

export function getSentMotivationDisplay(
  motivations: FriendMotivation[],
  recipientId: string,
): SentMotivationDisplay | null {
  const latest = buildLatestSentByRecipient(motivations).get(recipientId)
  if (!latest) {
    return null
  }

  return {
    motivation: latest,
    isRead: latest.read_at != null,
  }
}

export function getSentMotivationStatusLabel(display: SentMotivationDisplay): string {
  if (!display.isRead) {
    return 'Dernier emoji en attente de lecture.'
  }

  return 'Dernier emoji lu par votre ami.'
}

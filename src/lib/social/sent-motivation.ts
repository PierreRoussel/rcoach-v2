import { isAfter, parseISO, startOfDay } from 'date-fns'

import type { FriendMotivation } from '@/lib/graphql/operations'

export type SentMotivationState = {
  motivation: FriendMotivation
  canSendAgain: boolean
  isRead: boolean
}

export function buildLatestSentByRecipient(
  motivations: FriendMotivation[],
): Map<string, FriendMotivation> {
  const latestByRecipient = new Map<string, FriendMotivation>()

  for (const motivation of motivations) {
    if (!latestByRecipient.has(motivation.recipient_id)) {
      latestByRecipient.set(motivation.recipient_id, motivation)
    }
  }

  return latestByRecipient
}

/** Envoi possible a partir du lendemain (jour calendaire) de la lecture. */
export function canSendMotivationAfterRead(
  motivation: FriendMotivation,
  now = new Date(),
): boolean {
  if (!motivation.read_at) {
    return false
  }

  const readDay = startOfDay(parseISO(motivation.read_at))
  const today = startOfDay(now)
  return isAfter(today, readDay)
}

export function getSentMotivationSendState(
  motivations: FriendMotivation[],
  recipientId: string,
  now = new Date(),
): SentMotivationState | null {
  const latest = buildLatestSentByRecipient(motivations).get(recipientId)
  if (!latest) {
    return null
  }

  const canSendAgain = canSendMotivationAfterRead(latest, now)
  if (canSendAgain) {
    return null
  }

  return {
    motivation: latest,
    canSendAgain: false,
    isRead: latest.read_at != null,
  }
}

export function getSentMotivationBlockedMessage(state: SentMotivationState): string {
  if (!state.isRead) {
    return 'En attente de lecture par votre ami.'
  }

  return 'Nouvel emoji disponible demain.'
}

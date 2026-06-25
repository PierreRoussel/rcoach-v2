import { describe, expect, it } from 'vitest'

import type { FriendMotivation } from '@/lib/graphql/operations'

import {
  canSendMotivationAfterRead,
  getSentMotivationSendState,
} from '@/lib/social/sent-motivation'

function sentMotivation(
  overrides: Partial<FriendMotivation> & Pick<FriendMotivation, 'recipient_id'>,
): FriendMotivation {
  return {
    id: 'motivation-1',
    sender_id: 'me',
    recipient_id: overrides.recipient_id,
    emoji: '🔥',
    message: 'Bravo',
    preset_key: 'fire',
    read_at: null,
    hearted_at: null,
    reply_message: null,
    sender_reply_seen_at: null,
    created_at: '2026-06-25T10:00:00.000Z',
    ...overrides,
  }
}

describe('sent-motivation', () => {
  it('blocks sending while the latest motivation is unread', () => {
    const state = getSentMotivationSendState(
      [sentMotivation({ recipient_id: 'friend-a' })],
      'friend-a',
      new Date('2026-06-25T18:00:00.000Z'),
    )

    expect(state?.isRead).toBe(false)
    expect(state?.canSendAgain).toBe(false)
  })

  it('blocks sending on the same calendar day as read', () => {
    const readAt = new Date(2026, 5, 25, 15, 30).toISOString()
    const motivation = sentMotivation({
      recipient_id: 'friend-a',
      read_at: readAt,
    })

    expect(
      canSendMotivationAfterRead(motivation, new Date(2026, 5, 25, 23, 59)),
    ).toBe(false)
    expect(
      getSentMotivationSendState([motivation], 'friend-a', new Date(2026, 5, 25, 23, 59)),
    ).not.toBeNull()
  })

  it('allows sending from the day after read', () => {
    const readAt = new Date(2026, 5, 25, 15, 30).toISOString()
    const motivation = sentMotivation({
      recipient_id: 'friend-a',
      read_at: readAt,
    })

    expect(
      canSendMotivationAfterRead(motivation, new Date(2026, 5, 26, 0, 1)),
    ).toBe(true)
    expect(
      getSentMotivationSendState(
        [motivation],
        'friend-a',
        new Date(2026, 5, 26, 0, 1),
      ),
    ).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'

import type { FriendMotivation } from '@/lib/graphql/operations'

import { getSentMotivationDisplay } from '@/lib/social/sent-motivation'

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
  it('shows the latest sent emoji even when unread', () => {
    const display = getSentMotivationDisplay(
      [sentMotivation({ recipient_id: 'friend-a' })],
      'friend-a',
    )

    expect(display?.isRead).toBe(false)
    expect(display?.motivation.emoji).toBe('🔥')
  })

  it('keeps showing the latest sent emoji after read', () => {
    const display = getSentMotivationDisplay(
      [
        sentMotivation({
          recipient_id: 'friend-a',
          read_at: '2026-06-25T15:30:00.000Z',
        }),
      ],
      'friend-a',
    )

    expect(display?.isRead).toBe(true)
  })

  it('uses the most recent send per friend', () => {
    const display = getSentMotivationDisplay(
      [
        sentMotivation({
          id: 'old',
          recipient_id: 'friend-a',
          emoji: '👏',
          created_at: '2026-06-24T10:00:00.000Z',
        }),
        sentMotivation({
          id: 'new',
          recipient_id: 'friend-a',
          emoji: '💪',
          created_at: '2026-06-25T10:00:00.000Z',
        }),
      ],
      'friend-a',
    )

    expect(display?.motivation.emoji).toBe('💪')
  })
})

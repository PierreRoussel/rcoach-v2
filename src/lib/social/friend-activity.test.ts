import { describe, expect, it } from 'vitest'

import type { FriendProfileSummary } from '@/lib/graphql/operations'
import { summarizeFriendActivity } from '@/lib/social/friend-activity'

describe('summarizeFriendActivity', () => {
  it('computes workout and nutrition streaks from friend activity', () => {
    const friend: FriendProfileSummary = {
      id: 'friend-1',
      display_name: 'Alice',
      avatar_url: null,
      workouts: [{ started_at: '2026-06-23T10:00:00Z' }],
      meal_log_entries: [
        { logged_date: '2026-06-24', calories: 500 },
        { logged_date: '2026-06-25', calories: 600 },
      ],
    }

    const summary = summarizeFriendActivity(friend, new Date('2026-06-25T12:00:00Z'))

    expect(summary.friendId).toBe('friend-1')
    expect(summary.workoutStreak).toBeGreaterThanOrEqual(1)
    expect(summary.nutritionStreak).toBe(2)
  })
})

import { describe, expect, it } from 'vitest'

import { parseAdminSupportRequests } from '@/lib/admin/support-requests'

describe('parseAdminSupportRequests', () => {
  it('parses support request rows', () => {
    const parsed = parseAdminSupportRequests({
      requests: [
        {
          id: 'r1',
          userId: 'u1',
          displayName: 'Alice',
          subject: 'Bug affichage',
          message: 'Le graphique ne charge pas.',
          status: 'open',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      limit: 50,
    })

    expect(parsed.requests).toHaveLength(1)
    expect(parsed.requests[0]?.status).toBe('open')
    expect(parsed.requests[0]?.subject).toBe('Bug affichage')
  })
})

import { describe, expect, it } from 'vitest'

import { legalUrl, supportMailto } from '@/lib/legal/config'

describe('legal config helpers', () => {
  it('builds absolute legal urls', () => {
    expect(legalUrl('/legal/privacy')).toMatch(/\/legal\/privacy$/)
  })

  it('builds support mailto links', () => {
    expect(supportMailto('Aide RCoach')).toContain('mailto:')
    expect(supportMailto('Aide RCoach')).toContain('subject=')
  })
})

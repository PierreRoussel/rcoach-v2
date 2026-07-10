import { describe, expect, it } from 'vitest'

import {
  formatLegalSiren,
  formatLegalSiret,
  isLegalConfigComplete,
  legalUrl,
  supportMailto,
} from '@/lib/legal/config'

describe('legal config helpers', () => {
  it('builds absolute legal urls', () => {
    expect(legalUrl('/legal/privacy')).toMatch(/\/legal\/privacy$/)
  })

  it('builds support mailto links', () => {
    expect(supportMailto('Aide RCoach')).toContain('mailto:')
    expect(supportMailto('Aide RCoach')).toContain('subject=')
  })

  it('formats french company identifiers', () => {
    expect(formatLegalSiren('917869810')).toBe('917 869 810')
    expect(formatLegalSiret('91786981000015')).toBe('917 869 810 00015')
  })

  it('marks default publisher config as complete', () => {
    expect(isLegalConfigComplete()).toBe(true)
  })
})

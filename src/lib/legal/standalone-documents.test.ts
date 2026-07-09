import { describe, expect, it } from 'vitest'

import {
  isStandaloneDocumentPath,
  normalizeDocumentPath,
  standaloneDocumentHref,
} from '@/lib/legal/standalone-documents'

describe('standalone document helpers', () => {
  it('normalizes document paths', () => {
    expect(normalizeDocumentPath('help')).toBe('/help')
    expect(normalizeDocumentPath('/help')).toBe('/help')
  })

  it('detects standalone document paths', () => {
    expect(isStandaloneDocumentPath('/help')).toBe(true)
    expect(isStandaloneDocumentPath('/app/profile')).toBe(false)
  })

  it('adds from=app when opening from the app shell', () => {
    const href = standaloneDocumentHref('/help', { fromApp: true })
    const url = new URL(href)

    expect(url.pathname).toBe('/help')
    expect(url.searchParams.get('from')).toBe('app')
  })
})

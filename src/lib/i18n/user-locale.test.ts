import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_USER_LOCALE,
  detectUserLocale,
  normalizeUserLocale,
  readStoredPreferredUserLocale,
  resolveLocaleForAuthEmails,
  storePreferredUserLocale,
} from '@/lib/i18n/user-locale'

describe('normalizeUserLocale', () => {
  it('maps French variants to fr', () => {
    expect(normalizeUserLocale('fr')).toBe('fr')
    expect(normalizeUserLocale('fr-FR')).toBe('fr')
    expect(normalizeUserLocale('fr_CA')).toBe('fr')
  })

  it('maps English variants to en', () => {
    expect(normalizeUserLocale('en')).toBe('en')
    expect(normalizeUserLocale('en-US')).toBe('en')
    expect(normalizeUserLocale('en_GB')).toBe('en')
  })

  it('falls back to en for unsupported languages', () => {
    expect(normalizeUserLocale('de-DE')).toBe(DEFAULT_USER_LOCALE)
    expect(normalizeUserLocale(null)).toBe(DEFAULT_USER_LOCALE)
  })
})

describe('detectUserLocale', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses navigator.language when no preference is stored', () => {
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
      clear: () => {
        storage.clear()
      },
    })
    vi.stubGlobal('navigator', { language: 'fr-FR', languages: ['fr-FR'] })

    expect(detectUserLocale()).toBe('fr')
  })

  it('prefers stored locale over navigator', () => {
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
      clear: () => {
        storage.clear()
      },
    })
    vi.stubGlobal('navigator', { language: 'fr-FR', languages: ['fr-FR'] })
    storePreferredUserLocale('en')

    expect(detectUserLocale()).toBe('en')
    expect(readStoredPreferredUserLocale()).toBe('en')
  })
})

describe('resolveLocaleForAuthEmails', () => {
  it('uses the account locale when available', () => {
    expect(resolveLocaleForAuthEmails('fr')).toBe('fr')
  })

  it('detects locale when account locale is missing', () => {
    vi.stubGlobal('navigator', { language: 'en-US', languages: ['en-US'] })

    expect(resolveLocaleForAuthEmails(null)).toBe('en')
  })
})

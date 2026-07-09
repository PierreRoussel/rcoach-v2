export const SUPPORTED_USER_LOCALES = ['fr', 'en'] as const

export type UserLocale = (typeof SUPPORTED_USER_LOCALES)[number]

export const DEFAULT_USER_LOCALE: UserLocale = 'en'

const PREFERRED_LOCALE_STORAGE_KEY = 'rcoach:preferred-user-locale'

export function normalizeUserLocale(
  raw: string | null | undefined,
): UserLocale {
  if (!raw?.trim()) {
    return DEFAULT_USER_LOCALE
  }

  const languageCode = raw.trim().toLowerCase().split(/[-_]/)[0]
  if (languageCode === 'fr') {
    return 'fr'
  }
  if (languageCode === 'en') {
    return 'en'
  }

  return DEFAULT_USER_LOCALE
}

export function readStoredPreferredUserLocale(): UserLocale | null {
  if (typeof localStorage === 'undefined') {
    return null
  }

  try {
    const stored = localStorage.getItem(PREFERRED_LOCALE_STORAGE_KEY)
    return stored ? normalizeUserLocale(stored) : null
  } catch {
    return null
  }
}

export function storePreferredUserLocale(locale: UserLocale) {
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    localStorage.setItem(PREFERRED_LOCALE_STORAGE_KEY, locale)
  } catch {
    // Ignore quota / private mode errors.
  }
}

function readNavigatorLocale(): string | null {
  if (typeof navigator === 'undefined') {
    return null
  }

  return navigator.language || navigator.languages?.[0] || null
}

/** Best-effort locale from device/browser (works in Capacitor Android WebView). */
export function detectUserLocale(): UserLocale {
  const stored = readStoredPreferredUserLocale()
  if (stored) {
    return stored
  }

  return normalizeUserLocale(readNavigatorLocale())
}

export function resolveLocaleForAuthEmails(
  sessionLocale: string | null | undefined,
): UserLocale {
  if (sessionLocale?.trim()) {
    return normalizeUserLocale(sessionLocale)
  }

  return detectUserLocale()
}

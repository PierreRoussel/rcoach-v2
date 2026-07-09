import type { NhostClient } from '@nhost/nhost-js'

import {
  GET_MY_AUTH_USER_LOCALE,
  UPDATE_MY_AUTH_USER_LOCALE,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  DEFAULT_USER_LOCALE,
  detectUserLocale,
  normalizeUserLocale,
  storePreferredUserLocale,
  type UserLocale,
} from '@/lib/i18n/user-locale'

const BOOTSTRAP_STORAGE_PREFIX = 'rcoach:auth-locale-bootstrapped:'

function bootstrapStorageKey(userId: string) {
  return `${BOOTSTRAP_STORAGE_PREFIX}${userId}`
}

function hasBootstrappedAuthLocale(userId: string) {
  if (typeof localStorage === 'undefined') {
    return false
  }

  try {
    return localStorage.getItem(bootstrapStorageKey(userId)) === '1'
  } catch {
    return false
  }
}

function markAuthLocaleBootstrapped(userId: string) {
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    localStorage.setItem(bootstrapStorageKey(userId), '1')
  } catch {
    // Ignore quota / private mode errors.
  }
}

export async function fetchAuthUserLocale(
  nhost: NhostClient,
  userId: string,
): Promise<UserLocale> {
  const data = await graphqlRequest<{
    user: { id: string; locale: string | null } | null
  }>(nhost, GET_MY_AUTH_USER_LOCALE, { id: userId })

  return normalizeUserLocale(data.user?.locale)
}

export async function updateAuthUserLocale(
  nhost: NhostClient,
  userId: string,
  locale: UserLocale,
) {
  const data = await graphqlRequest<{
    updateUser: { id: string; locale: string | null } | null
  }>(nhost, UPDATE_MY_AUTH_USER_LOCALE, { id: userId, locale })

  storePreferredUserLocale(locale)
  return normalizeUserLocale(data.updateUser?.locale ?? locale)
}

/** Sets auth.users.locale from the device on first session (OAuth / legacy accounts). */
export async function bootstrapAuthUserLocaleIfNeeded(
  nhost: NhostClient,
  userId: string,
) {
  if (hasBootstrappedAuthLocale(userId)) {
    return
  }

  try {
    const currentLocale = await fetchAuthUserLocale(nhost, userId)
    const detectedLocale = detectUserLocale()

    if (currentLocale === DEFAULT_USER_LOCALE && detectedLocale !== currentLocale) {
      await updateAuthUserLocale(nhost, userId, detectedLocale)
    }
  } finally {
    markAuthLocaleBootstrapped(userId)
  }
}

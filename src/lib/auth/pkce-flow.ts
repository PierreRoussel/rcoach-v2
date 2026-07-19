import { generatePKCEPair } from '@nhost/nhost-js/auth'
import type { NhostClient, Session } from '@nhost/nhost-js'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

import {
  clearPkceVerifier,
  persistPkceVerifier,
  readPkceVerifier,
} from './pkce-verifier-store'

export { PKCE_VERIFIER_KEY } from './pkce-verifier-store'

const pendingAuthCodeExchanges = new Map<string, Promise<Session>>()

const PKCE_SESSION_MISSING_MESSAGE =
  'Session de vérification introuvable. Rouvrez le lien depuis le même navigateur (et la même origine) que celui où vous avez demandé le reset ou Google — évitez de mélanger localhost et 127.0.0.1, et les navigateurs intégrés des apps mail.'

export async function storePkceChallenge(): Promise<string> {
  const { verifier, challenge } = await generatePKCEPair()
  await persistPkceVerifier(verifier)
  return challenge
}

export function resolveOAuthRedirectOrigin() {
  const currentOrigin = window.location.origin
  const override = import.meta.env.VITE_OAUTH_REDIRECT_ORIGIN?.trim().replace(/\/$/, '')

  if (!override || override === currentOrigin) {
    return currentOrigin
  }

  // PKCE verifier is stored on the current origin — callback must land here too.
  if (import.meta.env.DEV) {
    console.warn(
      `[OAuth] VITE_OAUTH_REDIRECT_ORIGIN (${override}) differs from current origin (${currentOrigin}). Using current origin so PKCE can be verified.`,
    )
  }

  return currentOrigin
}

export function buildOAuthRedirectUrl() {
  return `${resolveOAuthRedirectOrigin()}/auth/verify`
}

export async function startGoogleSignIn(nhost: NhostClient) {
  const codeChallenge = await storePkceChallenge()
  return nhost.auth.signInProviderURL('google', {
    redirectTo: buildOAuthRedirectUrl(),
    codeChallenge,
  })
}

export async function redirectToGoogleSignIn(nhost: NhostClient) {
  const redirectTo = buildOAuthRedirectUrl()
  const url = await startGoogleSignIn(nhost)

  if (!url.startsWith('http')) {
    throw new Error(
      'Configuration Nhost invalide (VITE_NHOST_SUBDOMAIN / VITE_NHOST_REGION). Rebuild l’APK avec .env.local.',
    )
  }

  if (import.meta.env.DEV) {
    console.info(
      `[OAuth] redirectTo=${redirectTo} — add this exact URL in Nhost Dashboard → Authentication → URL Configuration → Allowed redirect URLs`,
    )
  }

  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url })
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      throw new Error(
        detail.includes('not implemented')
          ? 'Plugin navigateur indisponible. Réinstallez l’app depuis le Play Store (version 2+).'
          : `Impossible d’ouvrir le navigateur OAuth (${detail}).`,
      )
    }
    return
  }

  window.location.href = url
}

export async function exchangeAuthCode(nhost: NhostClient, code: string) {
  const existing = pendingAuthCodeExchanges.get(code)
  if (existing) {
    return existing
  }

  const exchangePromise = (async () => {
    const codeVerifier = await readPkceVerifier()

    if (!codeVerifier) {
      throw new Error(PKCE_SESSION_MISSING_MESSAGE)
    }

    const response = await nhost.auth.tokenExchange({ code, codeVerifier })

    if (response.status !== 200 || response.body.session == null) {
      throw new Error('La vérification a échoué. Le lien est peut-être expiré.')
    }

    await clearPkceVerifier()
    return response.body.session
  })()

  pendingAuthCodeExchanges.set(code, exchangePromise)

  try {
    return await exchangePromise
  } catch (error) {
    pendingAuthCodeExchanges.delete(code)
    throw error
  }
}

export async function requestPasswordResetEmail(nhost: NhostClient, email: string) {
  const codeChallenge = await storePkceChallenge()

  // Password reset options only allow redirectTo — locale is taken from auth.users.
  return nhost.auth.sendPasswordResetEmail({
    email,
    codeChallenge,
    options: {
      redirectTo: `${resolveOAuthRedirectOrigin()}/auth/verify?flow=reset`,
    },
  })
}

export function buildEmailVerificationRedirectUrl(flow: 'signup' = 'signup') {
  return `${resolveOAuthRedirectOrigin()}/auth/verify?flow=${flow}`
}

import { generatePKCEPair } from '@nhost/nhost-js/auth'
import type { NhostClient } from '@nhost/nhost-js'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

import {
  detectUserLocale,
  resolveLocaleForAuthEmails,
  type UserLocale,
} from '@/lib/i18n/user-locale'

import { consumePkceVerifier, persistPkceVerifier } from './pkce-verifier-store'

export { PKCE_VERIFIER_KEY } from './pkce-verifier-store'

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
  const codeVerifier = await consumePkceVerifier()

  if (!codeVerifier) {
    throw new Error(
      'Session de vérification introuvable. Relancez Google depuis le même navigateur (évitez de mélanger localhost et 127.0.0.1). Sur l’app Android, mettez à jour l’APK si le problème persiste.',
    )
  }

  const response = await nhost.auth.tokenExchange({ code, codeVerifier })

  if (response.status !== 200 || response.body.session == null) {
    throw new Error('La vérification a échoué. Le lien est peut-être expiré.')
  }

  return response.body.session
}

export async function requestPasswordResetEmail(
  nhost: NhostClient,
  email: string,
  locale?: UserLocale,
) {
  const codeChallenge = await storePkceChallenge()
  const sessionLocale = nhost.getUserSession()?.user?.locale
  const resolvedLocale =
    locale ?? resolveLocaleForAuthEmails(sessionLocale)

  return nhost.auth.sendPasswordResetEmail({
    email,
    codeChallenge,
    options: {
      locale: resolvedLocale,
      redirectTo: `${resolveOAuthRedirectOrigin()}/auth/verify?flow=reset`,
    },
  })
}

export function buildEmailVerificationRedirectUrl(flow: 'signup' = 'signup') {
  return `${resolveOAuthRedirectOrigin()}/auth/verify?flow=${flow}`
}

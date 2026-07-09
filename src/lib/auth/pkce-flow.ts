import { generatePKCEPair } from '@nhost/nhost-js/auth'
import type { NhostClient } from '@nhost/nhost-js'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

export const PKCE_VERIFIER_KEY = 'nhost_pkce_verifier'

export async function storePkceChallenge(): Promise<string> {
  const { verifier, challenge } = await generatePKCEPair()
  localStorage.setItem(PKCE_VERIFIER_KEY, verifier)
  return challenge
}

export function consumePkceVerifier(): string | null {
  const verifier = localStorage.getItem(PKCE_VERIFIER_KEY)
  localStorage.removeItem(PKCE_VERIFIER_KEY)
  return verifier
}

export function resolveOAuthRedirectOrigin() {
  const override = import.meta.env.VITE_OAUTH_REDIRECT_ORIGIN?.trim()
  if (override) {
    return override.replace(/\/$/, '')
  }

  return window.location.origin
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

  if (import.meta.env.DEV) {
    console.info(
      `[OAuth] redirectTo=${redirectTo} — add this exact URL in Nhost Dashboard → Authentication → URL Configuration → Allowed redirect URLs`,
    )
  }

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, windowName: '_system' })
    return
  }

  window.location.href = url
}

export async function exchangeAuthCode(nhost: NhostClient, code: string) {
  const codeVerifier = consumePkceVerifier()

  if (!codeVerifier) {
    throw new Error(
      'Session de vérification introuvable. Relancez la procédure depuis le même navigateur.',
    )
  }

  const response = await nhost.auth.tokenExchange({ code, codeVerifier })

  if (response.status !== 200 || response.body.session == null) {
    throw new Error('La vérification a échoué. Le lien est peut-être expiré.')
  }

  return response.body.session
}

export async function requestPasswordResetEmail(nhost: NhostClient, email: string) {
  const codeChallenge = await storePkceChallenge()

  return nhost.auth.sendPasswordResetEmail({
    email,
    codeChallenge,
    options: {
      locale: 'fr',
      redirectTo: `${window.location.origin}/auth/verify?flow=reset`,
    },
  })
}

export function buildEmailVerificationRedirectUrl(flow: 'signup' = 'signup') {
  return `${window.location.origin}/auth/verify?flow=${flow}`
}

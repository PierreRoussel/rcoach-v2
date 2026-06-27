import { generatePKCEPair } from '@nhost/nhost-js/auth'
import type { NhostClient } from '@nhost/nhost-js'

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
      redirectTo: `${window.location.origin}/auth/verify?flow=reset`,
    },
  })
}

export function buildEmailVerificationRedirectUrl(flow: 'signup' = 'signup') {
  return `${window.location.origin}/auth/verify?flow=${flow}`
}

import { Capacitor } from '@capacitor/core'

export const PKCE_VERIFIER_KEY = 'nhost_pkce_verifier'

function readBrowserVerifier(): string | null {
  try {
    return (
      localStorage.getItem(PKCE_VERIFIER_KEY) ??
      sessionStorage.getItem(PKCE_VERIFIER_KEY)
    )
  } catch {
    return null
  }
}

async function readNativeVerifier(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return null
  }

  try {
    const { Preferences } = await import('@capacitor/preferences')
    const stored = await Preferences.get({ key: PKCE_VERIFIER_KEY })
    return stored.value
  } catch {
    return null
  }
}

export async function readPkceVerifier(): Promise<string | null> {
  return readBrowserVerifier() ?? (await readNativeVerifier())
}

export async function clearPkceVerifier(): Promise<void> {
  try {
    localStorage.removeItem(PKCE_VERIFIER_KEY)
    sessionStorage.removeItem(PKCE_VERIFIER_KEY)
  } catch {
    // Ignore storage errors.
  }

  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.remove({ key: PKCE_VERIFIER_KEY })
  } catch {
    // Ignore cleanup errors.
  }
}

export async function persistPkceVerifier(verifier: string): Promise<void> {
  try {
    localStorage.setItem(PKCE_VERIFIER_KEY, verifier)
    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier)
  } catch {
    // Continue with native persistence if browser storage is blocked.
  }

  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.set({ key: PKCE_VERIFIER_KEY, value: verifier })
  } catch {
    // Native persistence is best-effort; browser storage may still work.
  }
}

/** @deprecated Prefer readPkceVerifier + clearPkceVerifier after a successful exchange. */
export async function consumePkceVerifier(): Promise<string | null> {
  const verifier = await readPkceVerifier()
  await clearPkceVerifier()
  return verifier
}

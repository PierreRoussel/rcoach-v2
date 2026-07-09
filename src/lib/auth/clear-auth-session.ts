import type { NhostClient } from '@nhost/nhost-js'

/** Clears any local Nhost session (e.g. before signup to avoid ghost profile provisioning). */
export async function clearAuthSession(nhost: NhostClient) {
  const session = nhost.getUserSession()
  if (!session?.refreshTokenId) {
    return
  }

  try {
    await nhost.auth.signOut({ refreshToken: session.refreshTokenId })
  } catch {
    // Best-effort: stale tokens should not block signup.
  }
}

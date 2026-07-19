import type { NhostClient } from '@nhost/nhost-js'
import { DEFAULT_SESSION_KEY } from '@nhost/nhost-js/session'

/**
 * Nhost SessionStorage.onChange only fires in the tab that wrote the session.
 * Re-apply localStorage changes from other tabs (and on focus) so GraphQL + React
 * auth state stay in sync without a full page reload.
 */
export function subscribeCrossTabSessionSync(nhost: NhostClient): () => void {
  let lastAccessToken = nhost.getUserSession()?.accessToken ?? null

  const unsubscribeSession = nhost.sessionStorage.onChange((session) => {
    lastAccessToken = session?.accessToken ?? null
  })

  function applyFromStorage() {
    const session = nhost.sessionStorage.get()
    const nextToken = session?.accessToken?.trim() ? session.accessToken : null

    if (nextToken === lastAccessToken) {
      return
    }

    // Keep lastAccessToken in sync via onChange after set/remove to avoid loops.
    if (nextToken && session) {
      nhost.sessionStorage.set(session)
      return
    }

    nhost.sessionStorage.remove()
  }

  function onStorage(event: StorageEvent) {
    if (event.storageArea && event.storageArea !== window.localStorage) {
      return
    }

    if (event.key != null && event.key !== DEFAULT_SESSION_KEY) {
      return
    }

    applyFromStorage()
  }

  function onFocusOrVisible() {
    if (document.visibilityState === 'hidden') {
      return
    }

    applyFromStorage()
  }

  window.addEventListener('storage', onStorage)
  window.addEventListener('focus', onFocusOrVisible)
  document.addEventListener('visibilitychange', onFocusOrVisible)

  return () => {
    unsubscribeSession()
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('focus', onFocusOrVisible)
    document.removeEventListener('visibilitychange', onFocusOrVisible)
  }
}

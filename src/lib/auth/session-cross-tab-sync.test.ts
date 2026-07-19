import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_SESSION_KEY } from '@nhost/nhost-js/session'

import { subscribeCrossTabSessionSync } from '@/lib/auth/session-cross-tab-sync'

type MockSession = {
  accessToken: string
  refreshToken: string
  user: { id: string }
} | null

function createMockNhost(initialToken: string | null = null) {
  let storedSession: MockSession =
    initialToken == null
      ? null
      : {
          accessToken: initialToken,
          refreshToken: 'r',
          user: { id: 'u1' },
        }

  const listeners = new Set<(session: MockSession) => void>()

  return {
    getUserSession: () => storedSession,
    sessionStorage: {
      get: () => storedSession,
      set: vi.fn((session: { accessToken: string }) => {
        storedSession = {
          accessToken: session.accessToken,
          refreshToken: 'r',
          user: { id: 'u1' },
        }
        for (const listener of listeners) {
          listener(storedSession)
        }
      }),
      remove: vi.fn(() => {
        storedSession = null
        for (const listener of listeners) {
          listener(null)
        }
      }),
      onChange: (listener: (session: MockSession) => void) => {
        listeners.add(listener)
        return () => {
          listeners.delete(listener)
        }
      },
    },
    __setStoredSession(next: MockSession) {
      storedSession = next
    },
  }
}

function dispatchStorageEvent(partial: {
  key: string | null
  newValue: string | null
}) {
  const event = {
    type: 'storage',
    key: partial.key,
    newValue: partial.newValue,
    storageArea: window.localStorage,
  } as StorageEvent

  window.dispatchEvent(event)
}

describe('subscribeCrossTabSessionSync', () => {
  const listeners = {
    storage: new Set<EventListener>(),
    focus: new Set<EventListener>(),
    visibilitychange: new Set<EventListener>(),
  }

  beforeEach(() => {
    listeners.storage.clear()
    listeners.focus.clear()
    listeners.visibilitychange.clear()

    vi.stubGlobal('window', {
      localStorage: {},
      addEventListener: (type: string, listener: EventListener) => {
        if (type === 'storage') {
          listeners.storage.add(listener)
        }
        if (type === 'focus') {
          listeners.focus.add(listener)
        }
      },
      removeEventListener: (type: string, listener: EventListener) => {
        if (type === 'storage') {
          listeners.storage.delete(listener)
        }
        if (type === 'focus') {
          listeners.focus.delete(listener)
        }
      },
      dispatchEvent: (event: Event) => {
        if (event.type === 'storage') {
          for (const listener of listeners.storage) {
            listener(event)
          }
        }
        return true
      },
    })

    vi.stubGlobal('document', {
      visibilityState: 'visible',
      addEventListener: (type: string, listener: EventListener) => {
        if (type === 'visibilitychange') {
          listeners.visibilitychange.add(listener)
        }
      },
      removeEventListener: (type: string, listener: EventListener) => {
        if (type === 'visibilitychange') {
          listeners.visibilitychange.delete(listener)
        }
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('applies a session written by another tab via the storage event', () => {
    const nhost = createMockNhost(null)
    const unsubscribe = subscribeCrossTabSessionSync(nhost as never)

    nhost.__setStoredSession({
      accessToken: 'new-token',
      refreshToken: 'r',
      user: { id: 'u1' },
    })

    dispatchStorageEvent({
      key: DEFAULT_SESSION_KEY,
      newValue: JSON.stringify({ accessToken: 'new-token' }),
    })

    expect(nhost.sessionStorage.set).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'new-token' }),
    )

    unsubscribe()
  })

  it('does not rewrite when the access token is unchanged', () => {
    const nhost = createMockNhost('same-token')
    const unsubscribe = subscribeCrossTabSessionSync(nhost as never)

    dispatchStorageEvent({
      key: DEFAULT_SESSION_KEY,
      newValue: JSON.stringify({ accessToken: 'same-token' }),
    })

    expect(nhost.sessionStorage.set).not.toHaveBeenCalled()
    expect(nhost.sessionStorage.remove).not.toHaveBeenCalled()

    unsubscribe()
  })

  it('clears the session when another tab logs out', () => {
    const nhost = createMockNhost('old-token')
    const unsubscribe = subscribeCrossTabSessionSync(nhost as never)

    nhost.__setStoredSession(null)

    dispatchStorageEvent({
      key: DEFAULT_SESSION_KEY,
      newValue: null,
    })

    expect(nhost.sessionStorage.remove).toHaveBeenCalled()

    unsubscribe()
  })
})

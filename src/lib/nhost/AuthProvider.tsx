import { createClient, type NhostClient } from '@nhost/nhost-js'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { StoredSession } from '@nhost/nhost-js/session'

import { subscribeCrossTabSessionSync } from '@/lib/auth/session-cross-tab-sync'

const subdomain = import.meta.env.VITE_NHOST_SUBDOMAIN
const region = import.meta.env.VITE_NHOST_REGION

if (!subdomain || !region) {
  console.warn(
    'Missing VITE_NHOST_SUBDOMAIN or VITE_NHOST_REGION. Copy .env.example to .env.local.',
  )
}

export const nhost = createClient({
  subdomain: subdomain ?? 'local',
  region: region ?? 'local',
})

type AuthContextValue = {
  nhost: NhostClient
  user: StoredSession['user'] | null
  session: StoredSession | null
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function applySessionState(
  nextSession: StoredSession | null,
  setUser: (user: StoredSession['user'] | null) => void,
  setSession: (session: StoredSession | null) => void,
  setIsAuthenticated: (value: boolean) => void,
) {
  setUser(nextSession?.user ?? null)
  setSession(nextSession)
  setIsAuthenticated(Boolean(nextSession))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredSession['user'] | null>(null)
  const [session, setSession] = useState<StoredSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const value = useMemo(
    () => ({
      nhost,
      user,
      session,
      isAuthenticated,
      isLoading,
    }),
    [user, session, isAuthenticated, isLoading],
  )

  useEffect(() => {
    const currentSession = nhost.getUserSession()
    applySessionState(currentSession, setUser, setSession, setIsAuthenticated)
    setIsLoading(false)

    const unsubscribeSession = nhost.sessionStorage.onChange((nextSession) => {
      applySessionState(nextSession, setUser, setSession, setIsAuthenticated)
    })
    const unsubscribeCrossTab = subscribeCrossTabSessionSync(nhost)

    return () => {
      unsubscribeSession()
      unsubscribeCrossTab()
    }
  }, [])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  AppBottomNav,
  BrandLogo,
  ThemeToggle,
} from '@/design-system'
import { requireAuth } from '@/lib/auth/guards'
import { flushSyncQueue } from '@/lib/graphql/sync-queue'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { useMyProfile } from '@/hooks/useProfile'

export const Route = createFileRoute('/app')({
  beforeLoad: requireAuth,
  component: AppLayout,
})

function AppLayout() {
  const { nhost } = useAuth()
  const { data: profile } = useMyProfile()
  const hydrate = useActiveWorkoutStore((state) => state.hydrate)

  useEffect(() => {
    void hydrate()
    void flushSyncQueue(nhost)
  }, [hydrate, nhost])

  async function handleSignOut() {
    const session = nhost.getUserSession()
    if (session?.refreshTokenId) {
      await nhost.auth.signOut({ refreshToken: session.refreshTokenId })
    }
    window.location.href = '/auth/login'
  }

  const showCoachLink =
    profile?.role === 'coach' || profile?.role === 'both'

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <BrandLogo compact />
            <p className="mt-1 truncate font-display text-sm font-black text-foreground">
              {profile?.display_name ?? 'Mon espace'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {showCoachLink ? (
              <Button variant="soft" size="sm" asChild>
                <Link to="/coach">Coach</Link>
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Quitter
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        <Outlet />
      </main>

      <AppBottomNav />
    </div>
  )
}

import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
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
    <div className="mx-auto flex min-h-svh max-w-lg flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Athlete
          </p>
          <h1 className="font-semibold">
            {profile?.display_name ?? 'Mon espace'}
          </h1>
        </div>
        <div className="flex gap-2">
          {showCoachLink ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/coach">Coach</Link>
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Deconnexion
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4">
        <Outlet />
      </main>

      <nav className="sticky bottom-0 grid grid-cols-3 border-t bg-background px-2 py-2 text-xs">
        <Link
          to="/app"
          className="rounded-md px-2 py-2 text-center hover:bg-muted"
          activeOptions={{ exact: true }}
          activeProps={{ className: 'rounded-md bg-muted px-2 py-2 text-center' }}
        >
          Home
        </Link>
        <Link
          to="/app/stats"
          className="rounded-md px-2 py-2 text-center hover:bg-muted"
          activeProps={{ className: 'rounded-md bg-muted px-2 py-2 text-center' }}
        >
          Stats
        </Link>
        <Link
          to="/app/profile"
          className="rounded-md px-2 py-2 text-center hover:bg-muted"
          activeProps={{ className: 'rounded-md bg-muted px-2 py-2 text-center' }}
        >
          Profil
        </Link>
      </nav>
    </div>
  )
}

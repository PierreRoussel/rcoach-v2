import { createFileRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useMyProfile } from '@/hooks/useProfile'

export const Route = createFileRoute('/app')({
  component: AppLayout,
})

function AppLayout() {
  const { isAuthenticated, isLoading, nhost } = useAuth()
  const navigate = useNavigate()
  const { data: profile } = useMyProfile()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: '/auth/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  async function handleSignOut() {
    const session = nhost.getUserSession()
    if (session?.refreshTokenId) {
      await nhost.auth.signOut({ refreshToken: session.refreshTokenId })
    }
    await navigate({ to: '/auth/login' })
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Chargement...
      </div>
    )
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
          activeProps={{ className: 'rounded-md bg-muted px-2 py-2 text-center' }}
        >
          Home
        </Link>
        <span className="rounded-md px-2 py-2 text-center text-muted-foreground">
          Stats
        </span>
        <span className="rounded-md px-2 py-2 text-center text-muted-foreground">
          Profil
        </span>
      </nav>
    </div>
  )
}

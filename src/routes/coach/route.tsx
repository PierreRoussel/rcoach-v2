import { createFileRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useMyProfile } from '@/hooks/useProfile'

export const Route = createFileRoute('/coach')({
  component: CoachLayout,
})

function CoachLayout() {
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

  const isCoach = profile?.role === 'coach' || profile?.role === 'both'

  return (
    <div className="min-h-svh md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r p-4 md:block">
        <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
          Coach
        </p>
        <h1 className="mb-6 text-lg font-semibold">RCoach ERP</h1>
        <nav className="space-y-1 text-sm">
          <Link
            to="/coach"
            className="block rounded-md px-3 py-2 hover:bg-muted"
            activeProps={{ className: 'block rounded-md bg-muted px-3 py-2' }}
          >
            Dashboard
          </Link>
          <span className="block rounded-md px-3 py-2 text-muted-foreground">
            Clients
          </span>
          <span className="block rounded-md px-3 py-2 text-muted-foreground">
            Programmes
          </span>
          <span className="block rounded-md px-3 py-2 text-muted-foreground">
            Analytics
          </span>
        </nav>
        <div className="mt-8 space-y-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/app">Vue athlete</Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full" onClick={handleSignOut}>
            Deconnexion
          </Button>
        </div>
      </aside>

      <div className="flex min-h-svh flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
          <h1 className="font-semibold">Coach</h1>
          <Button variant="outline" size="sm" asChild>
            <Link to="/app">App</Link>
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {!isCoach ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Espace coach — desktop recommande. Passez votre profil en role
              coach pour debloquer cette vue (Phase 2).
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

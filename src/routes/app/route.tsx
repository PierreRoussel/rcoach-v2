import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'

import { AppWelcomeHeader } from '@/components/app/AppWelcomeHeader'
import { Button } from '@/components/ui/button'
import { AppBottomNav } from '@/design-system'
import { requireAuth } from '@/lib/auth/guards'
import { flushSyncQueue } from '@/lib/graphql/sync-queue'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { useMyProfile } from '@/hooks/useProfile'

function resolveDisplayName(
  profileName: string | null | undefined,
  user: ReturnType<typeof useAuth>['user'],
): string | null {
  if (profileName?.trim()) {
    return profileName.trim()
  }

  if (user?.displayName?.trim()) {
    return user.displayName.trim()
  }

  const email = user?.email?.trim()
  if (!email) {
    return null
  }

  const atIndex = email.indexOf('@')
  return atIndex === -1 ? email : email.slice(0, atIndex)
}

export const Route = createFileRoute('/app')({
  beforeLoad: requireAuth,
  component: AppLayout,
})

function AppLayout() {
  const { nhost, user } = useAuth()
  const { data: profile } = useMyProfile()
  const hydrate = useActiveWorkoutStore((state) => state.hydrate)

  useEffect(() => {
    void hydrate()
    void flushSyncQueue(nhost)
  }, [hydrate, nhost])

  const showCoachLink =
    profile?.role === 'coach' || profile?.role === 'both'

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <AppWelcomeHeader displayName={resolveDisplayName(profile?.display_name, user)} />
          {showCoachLink ? (
            <Button variant="soft" size="sm" className="shrink-0" asChild>
              <Link to="/coach">Coach</Link>
            </Button>
          ) : null}
        </div>
      </header>

      <main className="flex-1 p-4">
        <Outlet />
      </main>

      <AppBottomNav />
    </div>
  )
}

import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

import { NutritionStreakGamificationProvider } from '@/components/nutrition/NutritionStreakGamificationProvider'
import { SubscriptionLifecycleProvider } from '@/components/subscription/SubscriptionLifecycleProvider'
import { AppWelcomeHeader } from '@/components/app/AppWelcomeHeader'
import { ActiveWorkoutProgressBar } from '@/components/workout/ActiveWorkoutProgressBar'
import { ActiveWorkoutResumeFab } from '@/components/workout/ActiveWorkoutResumeFab'
import { Button } from '@/components/ui/button'
import { AppBottomNav } from '@/design-system'
import { requireAppOnboardingComplete, requireAuth } from '@/lib/auth/guards'
import { resolveDisplayName } from '@/lib/profile/resolve-display-name'
import { flushSyncQueue } from '@/lib/graphql/sync-queue'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { useMyProfile } from '@/hooks/useProfile'
import { useNutritionSync } from '@/hooks/useNutritionSync'
import { useProfileNavBadgeCount } from '@/hooks/useFriends'

export const Route = createFileRoute('/app')({
  beforeLoad: async ({ location }) => {
    requireAuth()

    if (location.pathname === '/app/onboarding') {
      return
    }

    await requireAppOnboardingComplete()
  },
  component: AppLayout,
})

function AppLayout() {
  const { nhost, user } = useAuth()
  const { data: profile } = useMyProfile()
  const hydrate = useActiveWorkoutStore((state) => state.hydrate)
  const isOnboarding = useRouterState({
    select: (state) => state.location.pathname === '/app/onboarding',
  })

  useNutritionSync()
  useProfileNavBadgeCount()

  useEffect(() => {
    void hydrate()
    void flushSyncQueue(nhost)
  }, [hydrate, nhost])

  const showCoachLink =
    profile?.role === 'coach' || profile?.role === 'both'

  if (isOnboarding) {
    return <Outlet />
  }

  return (
    <SubscriptionLifecycleProvider>
      <NutritionStreakGamificationProvider>
        <div className="mx-auto flex min-h-svh max-w-lg flex-col bg-background">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <AppWelcomeHeader displayName={resolveDisplayName(profile?.display_name, user) || null} />
            {showCoachLink ? (
              <Button variant="soft" size="sm" className="shrink-0" asChild>
                <Link to="/coach">Coach</Link>
              </Button>
            ) : null}
          </div>
          <ActiveWorkoutProgressBar />
        </header>

        <main className="flex-1 p-4 pb-20">
          <Outlet />
        </main>

        <ActiveWorkoutResumeFab />
        <AppBottomNav />
      </div>
      </NutritionStreakGamificationProvider>
    </SubscriptionLifecycleProvider>
  )
}

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { z } from 'zod'

import { DietDayCarousel } from '@/components/nutrition/DietDayCarousel'
import { DietDayPanel } from '@/components/nutrition/DietDayPanel'
import { NutritionHintFab } from '@/components/nutrition/NutritionHintFab'
import { NutritionOnboardingWizard } from '@/components/nutrition/NutritionOnboardingWizard'
import { GoalsHomeSummaryTile } from '@/components/goals/GoalsHomeSummaryTile'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AnimateIn } from '@/design-system'
import { useDietEntranceAnimation } from '@/hooks/useDietEntranceAnimation'
import { runNutritionSync } from '@/hooks/useNutritionSync'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { useNutritionStreakGamificationActions } from '@/components/nutrition/NutritionStreakGamificationProvider'
import { useNutritionStreak } from '@/hooks/useNutritionStreak'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { usePendingNutritionSyncCount } from '@/hooks/usePendingNutritionSync'
import { useWeightGoal } from '@/hooks/useWeightGoal'
import { hasNutritionSetup, isNutritionConfigured } from '@/lib/nutrition/onboarding'
import { toDateKey } from '@/lib/nutrition/dates'
import { useAuth } from '@/lib/nhost/AuthProvider'

const dietSearchSchema = z.object({
  date: z.string().optional(),
})

export const Route = createFileRoute('/app/diet/')({
  validateSearch: dietSearchSchema,
  component: DietPage,
})

const NUTRITION_ONBOARDING_DISMISSED_KEY = 'nutrition-onboarding-dismissed'

function DietPage() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate({ from: '/app/diet/' })
  const search = Route.useSearch()
  const urlDate = search.date ?? toDateKey(new Date())
  const [activeDate, setActiveDate] = useState(urlDate)
  const [isRetryingSync, setIsRetryingSync] = useState(false)
  const { data: settings, isLoading: settingsLoading, isFetched: settingsFetched } =
    useNutritionSettings()
  const { data: weightGoal, isFetched: weightGoalFetched } = useWeightGoal()
  const { streak, isFrozen, validatedToday } = useNutritionStreak(settings?.daily_calorie_target ?? 0)
  const { reconcileOnDietPageOpen, isStreakDataReady } = useNutritionStreakGamificationActions()
  const reconcileOnDietPageOpenRef = useRef(reconcileOnDietPageOpen)
  reconcileOnDietPageOpenRef.current = reconcileOnDietPageOpen
  const hasReconciledDietOpenRef = useRef(false)
  const { data: pendingSyncCount = 0 } = usePendingNutritionSyncCount()
  const isOnline = useOnlineStatus()
  const shouldAnimateEntrance = useDietEntranceAnimation()
  const [wizardDismissed, setWizardDismissed] = useState(
    () => sessionStorage.getItem(NUTRITION_ONBOARDING_DISMISSED_KEY) === '1',
  )

  useEffect(() => {
    setActiveDate(urlDate)
  }, [urlDate])

  const setupStatusReady = settingsFetched && weightGoalFetched
  const hasSetup = hasNutritionSetup(settings, weightGoal)
  const needsOnboarding = setupStatusReady && !settingsLoading && !hasSetup
  const showWizard = needsOnboarding && !wizardDismissed
  const showNutritionConfigCard =
    setupStatusReady &&
    !settingsLoading &&
    !isNutritionConfigured(settings) &&
    wizardDismissed

  useEffect(() => {
    if (!isStreakDataReady || hasReconciledDietOpenRef.current) {
      return
    }

    hasReconciledDietOpenRef.current = true
    void reconcileOnDietPageOpenRef.current()
  }, [isStreakDataReady])

  useEffect(() => {
    return () => {
      hasReconciledDietOpenRef.current = false
    }
  }, [])

  const handleDateChange = useCallback((nextDate: string) => {
    setActiveDate(nextDate)
    void navigate({
      search: { date: nextDate },
      replace: true,
    })
  }, [navigate])

  async function retryPendingSync() {
    if (!isOnline || isRetryingSync) {
      return
    }

    setIsRetryingSync(true)

    try {
      await runNutritionSync(nhost, queryClient)
    } finally {
      setIsRetryingSync(false)
    }
  }

  const statusBanners =
    !isOnline || pendingSyncCount > 0 ? (
      <div className="space-y-2">
        {!isOnline ? (
          <p className="rounded-xl border border-border/70 bg-muted px-3 py-2 text-xs text-muted-foreground">
            Mode hors ligne — vos modifications seront synchronisées à la reconnexion.
          </p>
        ) : null}
        {pendingSyncCount > 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
            <p>
              {pendingSyncCount} modification{pendingSyncCount > 1 ? 's' : ''} en attente de
              synchronisation.
            </p>
            {isOnline ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 shrink-0 rounded-full px-3 text-xs"
                disabled={isRetryingSync}
                onClick={() => void retryPendingSync()}
              >
                {isRetryingSync ? 'Sync…' : 'Réessayer'}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    ) : null

  return (
    <div className="space-y-4 pb-4">
      {statusBanners ? (
        shouldAnimateEntrance ? (
          <AnimateIn delay={0}>{statusBanners}</AnimateIn>
        ) : (
          statusBanners
        )
      ) : null}

      {settingsLoading ? (
        shouldAnimateEntrance ? (
          <AnimateIn delay={80}>
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Chargement du journal nutrition...
              </CardContent>
            </Card>
          </AnimateIn>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Chargement du journal nutrition...
            </CardContent>
          </Card>
        )
      ) : settings ? (
        <DietDayCarousel
          date={activeDate}
          onDateChange={handleDateChange}
          animateEntrance={shouldAnimateEntrance}
          renderDay={(day) => (
            <DietDayPanel
              date={day}
              settings={settings}
              streak={streak}
              isFrozen={isFrozen}
              validatedToday={validatedToday}
              animateEntrance={shouldAnimateEntrance && day === activeDate}
            />
          )}
        />
      ) : null}

      {weightGoal ? (
        shouldAnimateEntrance ? (
          <AnimateIn delay={280}>
            <GoalsHomeSummaryTile />
          </AnimateIn>
        ) : (
          <GoalsHomeSummaryTile />
        )
      ) : null}

      {showNutritionConfigCard ? (
        shouldAnimateEntrance ? (
          <AnimateIn delay={320}>
            <Card>
              <CardContent className="space-y-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Configurez vos objectifs nutritionnels pour suivre vos macros au quotidien.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button type="button" onClick={() => setWizardDismissed(false)}>
                    Configurer maintenant
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/app/diet/settings">Ouvrir les réglages</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </AnimateIn>
        ) : (
          <Card>
            <CardContent className="space-y-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Configurez vos objectifs nutritionnels pour suivre vos macros au quotidien.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" onClick={() => setWizardDismissed(false)}>
                  Configurer maintenant
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/app/diet/settings">Ouvrir les réglages</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      ) : null}

      {settings && isNutritionConfigured(settings) && !showWizard ? (
        <NutritionHintFab anchorDate={activeDate} settings={settings} />
      ) : null}

      <NutritionOnboardingWizard
        open={showWizard}
        onOpenChange={(open) => {
          if (!open) {
            sessionStorage.setItem(NUTRITION_ONBOARDING_DISMISSED_KEY, '1')
            setWizardDismissed(true)
          }
        }}
        onCompleted={() => {
          sessionStorage.removeItem(NUTRITION_ONBOARDING_DISMISSED_KEY)
          setWizardDismissed(false)
        }}
      />
    </div>
  )
}

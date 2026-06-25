import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { DietDayCarousel } from '@/components/nutrition/DietDayCarousel'
import { DietDayPanel } from '@/components/nutrition/DietDayPanel'
import { NutritionOnboardingWizard } from '@/components/nutrition/NutritionOnboardingWizard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AnimateIn } from '@/design-system'
import { useDietEntranceAnimation } from '@/hooks/useDietEntranceAnimation'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { usePendingNutritionSyncCount } from '@/hooks/usePendingNutritionSync'
import { toDateKey } from '@/lib/nutrition/dates'

const dietSearchSchema = z.object({
  date: z.string().optional(),
})

export const Route = createFileRoute('/app/diet/')({
  validateSearch: dietSearchSchema,
  component: DietPage,
})

const NUTRITION_ONBOARDING_DISMISSED_KEY = 'nutrition-onboarding-dismissed'

function DietPage() {
  const navigate = useNavigate({ from: '/app/diet/' })
  const search = Route.useSearch()
  const urlDate = search.date ?? toDateKey(new Date())
  const [activeDate, setActiveDate] = useState(urlDate)
  const { data: settings, isLoading: settingsLoading } = useNutritionSettings()
  const { data: pendingSyncCount = 0 } = usePendingNutritionSyncCount()
  const isOnline = useOnlineStatus()
  const shouldAnimateEntrance = useDietEntranceAnimation()
  const [wizardDismissed, setWizardDismissed] = useState(
    () => sessionStorage.getItem(NUTRITION_ONBOARDING_DISMISSED_KEY) === '1',
  )

  useEffect(() => {
    setActiveDate(urlDate)
  }, [urlDate])

  const needsOnboarding = !settingsLoading && !settings?.onboarded_at
  const showWizard = needsOnboarding && !wizardDismissed

  function handleDateChange(nextDate: string) {
    setActiveDate(nextDate)
    void navigate({
      search: { date: nextDate },
      replace: true,
    })
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
          <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
            {pendingSyncCount} modification{pendingSyncCount > 1 ? 's' : ''} en attente de
            synchronisation.
          </p>
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
              animateEntrance={shouldAnimateEntrance && day === activeDate}
            />
          )}
        />
      ) : null}

      {needsOnboarding && wizardDismissed ? (
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

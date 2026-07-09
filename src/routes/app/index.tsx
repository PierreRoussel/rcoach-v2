import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarDays, Target, UtensilsCrossed } from 'lucide-react'

import { GoalsHomeSummaryTile } from '@/components/goals/GoalsHomeSummaryTile'
import { PremiumHomeWelcomeAnimation } from '@/components/subscription/PremiumHomeWelcomeAnimation'
import { HomeSessionsSummaryTiles } from '@/components/workout/HomeSessionsSummaryTiles'
import { MotivationHomeNotificationTile } from '@/components/social/MotivationHomeNotificationTile'
import { NutritionHomeSummaryTile } from '@/components/nutrition/NutritionHomeSummaryTile'
import { MissedPlannedSessionHomeTile } from '@/components/workout/MissedPlannedSessionHomeTile'
import { Button } from '@/components/ui/button'
import { AnimateIn, PageHeader, StaggerGroup } from '@/design-system'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'

export const Route = createFileRoute('/app/')({
  component: AppHomePage,
})

function AppHomePage() {
  const startedAt = useActiveWorkoutStore((state) => state.startedAt)

  return (
    <div className="space-y-4">
      <PremiumHomeWelcomeAnimation />
      <AnimateIn as="section" className="rounded-3xl border border-border bg-gradient-hero-animated p-5">
        <StaggerGroup baseDelay={80}>
          <PageHeader
            eyebrow="Athlète"
            title="Courir plus, manger plus"
            description="Démarrez une séance et suivez votre nutrition au quotidien."
          />
        </StaggerGroup>
        <StaggerGroup baseDelay={160} className="mt-4 flex flex-wrap gap-2">
          <Button variant="pill" asChild>
            <Link to="/app/workout/active">
              {startedAt ? 'Reprendre la séance' : 'Démarrer une séance'}
            </Link>
          </Button>
          <Button variant="secondary" className="rounded-full hover:scale-[1.02]" asChild>
            <Link to="/app/diet">
              <UtensilsCrossed className="size-4" />
              Diète
            </Link>
          </Button>
          <Button variant="soft-purple" asChild>
            <Link to="/app/goals">
              <Target className="size-4" />
              Objectif
            </Link>
          </Button>
          <Button variant="soft" className="rounded-full hover:scale-[1.02]" asChild>
            <Link to="/app/planning">
              <CalendarDays className="size-4" />
              Mon calendrier
            </Link>
          </Button>
        </StaggerGroup>
      </AnimateIn>

      <MotivationHomeNotificationTile />

      <AnimateIn delay={320}>
        <GoalsHomeSummaryTile />
      </AnimateIn>

      <AnimateIn delay={380}>
        <NutritionHomeSummaryTile />
      </AnimateIn>

      <AnimateIn delay={410}>
        <MissedPlannedSessionHomeTile />
      </AnimateIn>

      <AnimateIn delay={440}>
        <HomeSessionsSummaryTiles />
      </AnimateIn>
    </div>
  )
}

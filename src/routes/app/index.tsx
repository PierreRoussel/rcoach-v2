import { createFileRoute, Link } from '@tanstack/react-router'
import { History, UtensilsCrossed } from 'lucide-react'

import { RecentWorkoutsFeed } from '@/components/workout/RecentWorkoutsFeed'
import { NutritionHomeSummaryTile } from '@/components/nutrition/NutritionHomeSummaryTile'
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
          <Button variant="soft" asChild>
            <Link to="/app/sessions">
              <History className="size-4" />
              Mes séances
            </Link>
          </Button>
        </StaggerGroup>
      </AnimateIn>

      <AnimateIn delay={280}>
        <NutritionHomeSummaryTile />
      </AnimateIn>

      <AnimateIn delay={400}>
        <RecentWorkoutsFeed limit={5} showViewAll />
      </AnimateIn>
    </div>
  )
}

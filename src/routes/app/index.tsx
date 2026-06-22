import { createFileRoute, Link } from '@tanstack/react-router'
import { Dumbbell, History, Upload } from 'lucide-react'

import { RecentWorkoutsFeed } from '@/components/workout/RecentWorkoutsFeed'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/design-system'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'

export const Route = createFileRoute('/app/')({
  component: AppHomePage,
})

function AppHomePage() {
  const startedAt = useActiveWorkoutStore((state) => state.startedAt)

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-gradient-hero border border-border p-5">
        <PageHeader
          eyebrow="Athlete"
          title="Move with joy"
          description="Lancez une seance, suivez votre progression et importez vos donnees Hevy."
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="pill" asChild>
            <Link to="/app/workout/active">
              {startedAt ? 'Reprendre la seance' : 'Demarrer une seance'}
            </Link>
          </Button>
          <Button variant="soft" asChild>
            <Link to="/app/sessions">
              <History className="size-4" />
              Mes seances
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/app/exercises">
              <Dumbbell className="size-4" />
              Catalogue
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/app/import">
              <Upload className="size-4" />
              Import Hevy
            </Link>
          </Button>
        </div>
      </section>

      <RecentWorkoutsFeed limit={5} showViewAll />
    </div>
  )
}

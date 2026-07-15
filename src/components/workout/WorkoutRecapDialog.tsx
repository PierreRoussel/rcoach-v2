import { Clock, Dumbbell, Flame, Heart, Trophy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatCard } from '@/design-system'
import { HumanBodyHeatmap } from '@/components/stats/BodyHeatmap'
import { WorkoutPersonalRecordsList } from '@/components/workout/WorkoutPersonalRecordsList'
import type { HeartRateRecap } from '@/lib/health/read-heart-rate-summary'
import {
  formatWorkoutCalories,
  formatWorkoutFatEquivalent,
  formatWorkoutDuration,
  formatWorkoutVolume,
  type PersonalRecordHit,
} from '@/lib/stats/workout-metrics'

export type WorkoutRecapData = {
  title: string
  startedAt: string
  endedAt: string
  volumeKg: number
  completedSets: number
  estimatedCaloriesKcal: number
  records: PersonalRecordHit[]
  heartRate?: HeartRateRecap | null
  bodyIntensities: Record<string, number>
}

type WorkoutRecapDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  recap: WorkoutRecapData | null
  onContinue?: () => void
}

function recapHeadline(recordsCount: number): { title: string; description: string } {
  if (recordsCount === 0) {
    return {
      title: 'Séance terminée !',
      description: 'Séance solide, continue comme ça !',
    }
  }

  if (recordsCount === 1) {
    return {
      title: 'Nouveau record !',
      description: 'Tu viens de battre ton meilleur sur un exercice.',
    }
  }

  return {
    title: `${recordsCount} nouveaux records !`,
    description: "Performance exceptionnelle, tu progresses à vue d'œil.",
  }
}

export function WorkoutRecapDialog({
  open,
  onOpenChange,
  recap,
  onContinue,
}: WorkoutRecapDialogProps) {
  if (!recap) {
    return null
  }

  const duration = formatWorkoutDuration(recap.startedAt, recap.endedAt)
  const headline = recapHeadline(recap.records.length)
  const hasBodyMap = Object.values(recap.bodyIntensities).some((value) => value > 0)

  function handleContinue() {
    onOpenChange(false)
    onContinue?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader className="space-y-2 text-center sm:text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-hero">
            <Trophy
              className="size-7 text-primary"
              aria-hidden={recap.records.length === 0}
            />
          </div>
          <DialogTitle className="font-display text-2xl font-black">
            {headline.title}
          </DialogTitle>
          <DialogDescription className="text-sm">{headline.description}</DialogDescription>
          <p className="font-display text-base font-black text-foreground">{recap.title}</p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={<Clock className="size-4 text-primary" />}
            value={duration ?? '—'}
            label="Durée"
            tone="primary"
            className="p-3"
          />
          <StatCard
            icon={<Flame className="size-4 text-orange-500" />}
            value={formatWorkoutCalories(recap.estimatedCaloriesKcal)}
            label="Dépense est."
            tone="accent"
            className="p-3"
          />
          <StatCard
            icon={<Dumbbell className="size-4 text-secondary-foreground" />}
            value={formatWorkoutVolume(recap.volumeKg)}
            label="Tonnage"
            tone="secondary"
            className="p-3"
          />
          <StatCard
            icon={<Trophy className="size-4 text-accent-foreground" />}
            value={String(recap.records.length)}
            label="Records"
            tone="purple"
            className="p-3"
          />
        </div>

        {recap.estimatedCaloriesKcal > 0 ? (
          <div className="flex items-start gap-3 rounded-xl border border-orange-200/70 bg-gradient-to-br from-orange-50/90 to-amber-50/60 px-4 py-3 dark:border-orange-900/40 dark:from-orange-950/35 dark:to-amber-950/20">
            <Flame
              className="mt-0.5 size-5 shrink-0 text-orange-500"
              aria-hidden
            />
            <p className="text-sm leading-snug text-foreground">
              <span className="font-semibold">Vous avancez vers votre objectif !</span>{' '}
              {formatWorkoutCalories(recap.estimatedCaloriesKcal)} ={' '}
              {formatWorkoutFatEquivalent(recap.estimatedCaloriesKcal)} de gras brûlé !
            </p>
          </div>
        ) : null}

        {hasBodyMap ? (
          <HumanBodyHeatmap
            intensities={recap.bodyIntensities}
            compact
            showLegend={false}
            legendVariant="exercise"
          />
        ) : null}

        <p className="text-center font-data text-xs text-muted-foreground">
          {recap.completedSets}{' '}
          {recap.completedSets > 1 ? 'séries validées' : 'série validée'}
        </p>

        {recap.heartRate ? (
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              icon={<Heart className="size-4 text-destructive" />}
              value={`${recap.heartRate.avgBpm} bpm`}
              label="FC moy."
              tone="purple"
              className="p-3"
            />
            <StatCard
              icon={<Heart className="size-4 text-destructive" />}
              value={`${recap.heartRate.maxBpm} bpm`}
              label="FC max."
              tone="purple"
              className="p-3"
            />
          </div>
        ) : null}

        {recap.records.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Nouveaux records</p>
            <WorkoutPersonalRecordsList records={recap.records} />
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="pill"
            className="w-full"
            onClick={handleContinue}
          >
            Voir l'historique
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

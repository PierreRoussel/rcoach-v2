import { Clock, Dumbbell, Heart, Trophy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Pill, StatCard } from '@/design-system'
import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import type { HeartRateRecap } from '@/lib/health/read-heart-rate-summary'
import {
  formatWorkoutDuration,
  formatWorkoutVolume,
  type PersonalRecordHit,
  type PersonalRecordKind,
} from '@/lib/stats/workout-metrics'
import { formatSetPerformanceSummary } from '@/lib/workout/format-set-performance'

export type WorkoutRecapData = {
  title: string
  startedAt: string
  endedAt: string
  volumeKg: number
  completedSets: number
  records: PersonalRecordHit[]
  heartRate?: HeartRateRecap | null
}

type WorkoutRecapDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  recap: WorkoutRecapData | null
  onContinue?: () => void
}

function recordKindLabel(kind: PersonalRecordKind): string {
  return kind === 'volume' ? 'Record volume' : 'Record 1RM'
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

        <div className="grid grid-cols-3 gap-2">
          <StatCard
            icon={<Clock className="size-4 text-primary" />}
            value={duration ?? '—'}
            label="Durée"
            tone="primary"
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
            tone="accent"
            className="p-3"
          />
        </div>

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
            <ul className="space-y-2">
              {recap.records.map((record) => {
                const performance = formatSetPerformanceSummary(
                  { weightKg: record.weightKg, reps: record.reps },
                  { includeRpe: false },
                )

                return (
                  <li
                    key={record.exerciseId}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-soft-primary/30 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-black text-foreground">
                        <DisplayExerciseName name={record.exerciseName} />
                      </p>
                      <p className="font-data text-xs text-muted-foreground">
                        {performance}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {record.kinds.map((kind) => (
                        <Pill key={kind} tone="accent">
                          {recordKindLabel(kind)}
                        </Pill>
                      ))}
                    </div>
                  </li>
                )
              })}
            </ul>
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

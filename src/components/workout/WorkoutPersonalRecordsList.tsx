import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import { Pill } from '@/design-system'
import type { PersonalRecordHit, PersonalRecordKind } from '@/lib/stats/workout-metrics'
import { formatSetPerformanceSummary } from '@/lib/workout/format-set-performance'

function recordKindLabel(kind: PersonalRecordKind): string {
  return kind === 'volume' ? 'Record volume' : 'Record 1RM'
}

type WorkoutPersonalRecordsListProps = {
  records: PersonalRecordHit[]
}

export function WorkoutPersonalRecordsList({ records }: WorkoutPersonalRecordsListProps) {
  if (records.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun record personnel sur cette seance.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {records.map((record) => {
        const performance = formatSetPerformanceSummary(
          { weightKg: record.weightKg, reps: record.reps },
          { includeRpe: false },
        )

        return (
          <li
            key={`${record.exerciseId}-${record.weightKg}-${record.reps}`}
            className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-soft-primary/30 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-black text-foreground">
                <DisplayExerciseName
                  name={record.exerciseName}
                  nameFr={record.exerciseNameFr}
                  exerciseId={record.exerciseId}
                />
              </p>
              <p className="font-data text-xs text-muted-foreground">{performance}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {record.kinds.map((kind) => (
                <Pill key={kind} tone="solid-accent">
                  {recordKindLabel(kind)}
                </Pill>
              ))}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

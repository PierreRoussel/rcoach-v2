import { DisplayExercise } from '@/components/workout/DisplayExerciseName'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { WorkoutTemplate } from '@/lib/graphql/operations'
import { formatSetPerformanceSummary } from '@/lib/workout/format-set-performance'
import { isEmomSessionMode } from '@/lib/workout/template-session-label'

type TemplatePreviewContentProps = {
  template: WorkoutTemplate
}

export function TemplatePreviewContent({ template }: TemplatePreviewContentProps) {
  const isEmom = isEmomSessionMode(template.session_mode)

  return (
    <div className="space-y-3">
      {template.workout_template_exercises.map((entry) => (
        <Card key={entry.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <DisplayExercise exercise={entry.exercise} />
            </CardTitle>
            <CardDescription>
              {isEmom
                ? formatSetPerformanceSummary(
                    {
                      reps: entry.target_reps,
                      weightKg: entry.target_weight_kg,
                    },
                    { includeRpe: false },
                  ) ?? 'EMOM · objectif libre'
                : `${entry.workout_template_sets.length} série(s)`}
            </CardDescription>
          </CardHeader>
          {!isEmom ? (
            <CardContent className="space-y-1.5">
              {entry.workout_template_sets.map((set) => (
                <p key={set.set_index} className="text-sm text-muted-foreground">
                  Série {set.set_index + 1} ·{' '}
                  {formatSetPerformanceSummary({
                    weightKg: set.weight_kg,
                    reps: set.reps,
                    durationSeconds: set.duration_seconds ?? null,
                    setType: set.set_type,
                  })}
                </p>
              ))}
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  )
}

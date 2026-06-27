import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  buildTemplateLineupComparison,
  isTemplateLineupComparisonRowChanged,
  type TemplateExerciseLineSnapshot,
} from '@/lib/workout/template-lineup'

type UpdateTemplateFromWorkoutDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateName: string
  before: TemplateExerciseLineSnapshot[]
  after: TemplateExerciseLineSnapshot[]
  isSaving?: boolean
  onKeepTemplate: () => void
  onUpdateTemplate: () => void
}

function ExerciseCell({
  exercise,
  muted,
}: {
  exercise: TemplateExerciseLineSnapshot | null
  muted?: boolean
}) {
  if (!exercise) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return (
    <span className={cn('text-sm font-medium', muted && 'text-muted-foreground')}>
      <DisplayExerciseName
        name={exercise.exerciseName}
        nameFr={exercise.exerciseNameFr}
        exerciseId={exercise.exerciseId}
      />
    </span>
  )
}

export function UpdateTemplateFromWorkoutDialog({
  open,
  onOpenChange,
  templateName,
  before,
  after,
  isSaving = false,
  onKeepTemplate,
  onUpdateTemplate,
}: UpdateTemplateFromWorkoutDialogProps) {
  const rows = buildTemplateLineupComparison(before, after)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display font-black">
            Mettre à jour le modèle ?
          </DialogTitle>
          <DialogDescription>
            Vous avez modifié les exercices par rapport au modèle{' '}
            <span className="font-medium text-foreground">{templateName}</span>. Souhaitez-vous
            enregistrer ces changements dans le modèle ?
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-2 border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <div className="border-r border-border px-3 py-2">Modèle actuel</div>
            <div className="px-3 py-2">Nouvelle séance</div>
          </div>
          <div className="divide-y divide-border">
            {rows.map((row, index) => {
              const changed = isTemplateLineupComparisonRowChanged(row)

              return (
                <div
                  key={`${row.before?.exerciseId ?? 'none'}-${row.after?.exerciseId ?? 'none'}-${index}`}
                  className={cn(
                    'grid grid-cols-2',
                    changed && 'bg-soft-primary/30',
                  )}
                >
                  <div className="border-r border-border px-3 py-2.5">
                    <ExerciseCell exercise={row.before} muted={changed && !row.before} />
                  </div>
                  <div className="px-3 py-2.5">
                    <ExerciseCell exercise={row.after} muted={changed && !row.after} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:flex-col-reverse">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            disabled={isSaving}
            onClick={onKeepTemplate}
          >
            Conserver le modèle
          </Button>
          <Button
            type="button"
            variant="pill"
            className="w-full"
            disabled={isSaving}
            onClick={onUpdateTemplate}
          >
            {isSaving ? 'Enregistrement...' : 'Mettre à jour le modèle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

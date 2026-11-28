import { Replace } from 'lucide-react'

import { ExerciseEquipmentChips } from '@/components/workout/ExerciseEquipmentChips'
import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAllExercises } from '@/hooks/useExercises'
import { resolveEquipmentOptions } from '@/lib/workout/exercise-instance-key'

export type ExerciseInstanceEditTarget = {
  exerciseId: string
  exerciseName: string
  exerciseNameFr?: string | null
  equipment: string | null
  defaultRestSeconds: number
}

type ExerciseInstanceEditSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: ExerciseInstanceEditTarget | null
  onEquipmentChange: (equipment: string) => void
  onRestChange: (restSeconds: number) => void
  onReplace?: () => void
}

export function ExerciseInstanceEditSheet({
  open,
  onOpenChange,
  target,
  onEquipmentChange,
  onRestChange,
  onReplace,
}: ExerciseInstanceEditSheetProps) {
  const { data: catalog = [] } = useAllExercises({ enabled: open })
  const catalogExercise = target
    ? catalog.find((item) => item.id === target.exerciseId)
    : null
  const equipmentOptions = catalogExercise
    ? resolveEquipmentOptions(catalogExercise)
    : target?.equipment
      ? [target.equipment]
      : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display font-black">
            {target ? (
              <DisplayExerciseName
                name={target.exerciseName}
                nameFr={target.exerciseNameFr}
                exerciseId={target.exerciseId}
              />
            ) : (
              'Modifier l\'exercice'
            )}
          </SheetTitle>
          <SheetDescription>
            Équipement, repos par défaut et remplacement du mouvement.
          </SheetDescription>
        </SheetHeader>

        {target ? (
          <div className="mt-4 space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Équipement
              </p>
              <ExerciseEquipmentChips
                options={equipmentOptions}
                selectedEquipment={target.equipment}
                onSelect={onEquipmentChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instance-rest-seconds">Repos entre séries (s)</Label>
              <Input
                id="instance-rest-seconds"
                type="number"
                min={0}
                className="rounded-xl"
                value={target.defaultRestSeconds}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10)
                  if (Number.isFinite(value)) {
                    onRestChange(Math.max(0, value))
                  }
                }}
              />
            </div>

            {onReplace ? (
              <Button type="button" variant="outline" className="w-full rounded-xl" onClick={onReplace}>
                <Replace className="size-4" />
                Remplacer l&apos;exercice
              </Button>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
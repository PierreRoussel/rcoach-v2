import { useEffect, useState } from 'react'

import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { useExerciseDisplayName } from '@/hooks/useExerciseDisplayName'
import type { ActiveExerciseEntry } from '@/lib/workout/active-store'
import { getDefaultEmomGroupPartnerIndices } from '@/lib/workout/exercise-emom-group'

type EmomGroupDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercises: ActiveExerciseEntry[]
  anchorIndex: number | null
  onConfirm: (anchorIndex: number, partnerIndices: number[]) => void
}

export function EmomGroupDrawer({
  open,
  onOpenChange,
  exercises,
  anchorIndex,
  onConfirm,
}: EmomGroupDrawerProps) {
  const anchor = anchorIndex != null ? exercises[anchorIndex] : null
  const anchorName = useExerciseDisplayName(
    anchor?.exerciseName,
    anchor?.exerciseNameFr,
    anchor?.exerciseId,
  )
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])

  const partnerOptions = exercises
    .map((exercise, index) => ({ exercise, index }))
    .filter(({ index }) => index !== anchorIndex)

  useEffect(() => {
    if (!open || anchorIndex == null) {
      return
    }

    setSelectedIndices(getDefaultEmomGroupPartnerIndices(exercises, anchorIndex))
  }, [anchorIndex, exercises, open])

  function togglePartner(index: number, checked: boolean) {
    setSelectedIndices((current) => {
      if (checked) {
        return current.includes(index) ? current : [...current, index]
      }

      return current.filter((entry) => entry !== index)
    })
  }

  function handleConfirm() {
    if (anchorIndex == null) {
      return
    }

    onConfirm(anchorIndex, selectedIndices)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display font-black">
            Grouper dans la même minute
          </DrawerTitle>
          <DrawerDescription>
            Choisissez les exercices à réaliser pendant la même minute avec{' '}
            <span className="font-semibold text-foreground">{anchorName}</span>.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-3 overflow-y-auto px-4 pb-4">
          {partnerOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ajoutez d&apos;autres exercices pour créer une minute groupée.
            </p>
          ) : (
            partnerOptions.map(({ exercise, index }) => {
              const id = `emom-partner-${index}`
              return (
                <div
                  key={exercise.exerciseId}
                  className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
                >
                  <Checkbox
                    id={id}
                    checked={selectedIndices.includes(index)}
                    onCheckedChange={(checked) => togglePartner(index, checked === true)}
                  />
                  <Label htmlFor={id} className="min-w-0 flex-1 cursor-pointer font-medium">
                    <DisplayExerciseName
                      name={exercise.exerciseName}
                      nameFr={exercise.exerciseNameFr}
                      exerciseId={exercise.exerciseId}
                    />
                  </Label>
                </div>
              )
            })
          )}
        </div>

        <DrawerFooter>
          <Button type="button" variant="pill" onClick={handleConfirm}>
            Enregistrer
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

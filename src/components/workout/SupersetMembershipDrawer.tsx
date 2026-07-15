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
import { getDefaultSupersetPartnerIndices } from '@/lib/workout/exercise-superset'

type SupersetMembershipDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercises: ActiveExerciseEntry[]
  anchorIndex: number | null
  onConfirm: (anchorIndex: number, partnerIndices: number[]) => void
}

export function SupersetMembershipDrawer({
  open,
  onOpenChange,
  exercises,
  anchorIndex,
  onConfirm,
}: SupersetMembershipDrawerProps) {
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

    setSelectedIndices((current) => {
      const next = getDefaultSupersetPartnerIndices(exercises, anchorIndex)
      if (
        current.length === next.length &&
        current.every((value, index) => value === next[index])
      ) {
        return current
      }

      return next
    })
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
          <DrawerTitle className="font-display font-black">Configurer le superset</DrawerTitle>
          <DrawerDescription>
            Choisissez les exercices à enchaîner avec{' '}
            <span className="font-semibold text-foreground">{anchorName}</span>.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-2 overflow-y-auto px-4 pb-2">
          {partnerOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ajoutez d&apos;autres exercices pour créer un superset.
            </p>
          ) : (
            partnerOptions.map(({ exercise, index }) => {
              const checked = selectedIndices.includes(index)
              const inputId = `superset-partner-${exercise.exerciseId}`

              return (
                <Label
                  key={exercise.exerciseId}
                  htmlFor={inputId}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3"
                >
                  <Checkbox
                    id={inputId}
                    checked={checked}
                    onCheckedChange={(value) => togglePartner(index, value === true)}
                  />
                  <span className="min-w-0 flex-1 font-display font-black">
                    <DisplayExerciseName
                      name={exercise.exerciseName}
                      nameFr={exercise.exerciseNameFr}
                      exerciseId={exercise.exerciseId}
                    />
                  </span>
                  {exercise.supersetId != null ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      S{exercise.supersetId}
                    </span>
                  ) : null}
                </Label>
              )
            })
          )}
        </div>

        <DrawerFooter className="pt-2">
          <Button
            type="button"
            variant="pill"
            className="w-full"
            disabled={partnerOptions.length === 0}
            onClick={handleConfirm}
          >
            Appliquer
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

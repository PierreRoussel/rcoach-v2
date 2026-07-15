import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Exercise } from '@/lib/graphql/operations'
import {
  openExercisePicker,
  type ExercisePickerContext,
  type ExercisePickerReturnTo,
} from '@/lib/workout/exercise-picker-session'

type ExercisePickerProps = {
  excludeIds?: string[]
  triggerLabel?: string
  hideTrigger?: boolean
  mode?: 'add' | 'replace'
  replaceIndex?: number
  context?: ExercisePickerContext
  returnTo: ExercisePickerReturnTo
  programId?: string
  programDayId?: string
  templateId?: string
}

export function ExercisePicker({
  excludeIds = [],
  triggerLabel = 'Ajouter un exercice',
  hideTrigger = false,
  mode = 'add',
  replaceIndex,
  context = 'active',
  returnTo,
  programId,
  programDayId,
  templateId,
}: ExercisePickerProps) {
  const navigate = useNavigate()

  function launchPicker() {
    launchExercisePickerPage({
      excludeIds,
      mode,
      replaceIndex,
      context,
      returnTo,
      programId,
      programDayId,
      templateId,
      navigate: (options) => void navigate(options),
    })
  }

  if (hideTrigger) {
    return null
  }

  return (
    <Button type="button" variant="soft" className="rounded-full" onClick={launchPicker}>
      <Plus className="size-4" />
      {triggerLabel}
    </Button>
  )
}

export function launchExercisePickerPage(options: {
  excludeIds?: string[]
  mode?: 'add' | 'replace'
  replaceIndex?: number
  context?: ExercisePickerContext
  returnTo: ExercisePickerReturnTo
  programId?: string
  programDayId?: string
  templateId?: string
  navigate: (options: { to: string; search?: { context?: ExercisePickerContext } }) => void
}) {
  const context = options.context ?? 'active'

  openExercisePicker({
    excludeIds: options.excludeIds ?? [],
    mode: options.mode ?? 'add',
    replaceIndex: options.replaceIndex,
    context,
    returnTo: options.returnTo,
    programId: options.programId,
    programDayId: options.programDayId,
    templateId: options.templateId,
  })

  options.navigate({
    to: '/app/workout/add-exercise',
    search: { context },
  })
}

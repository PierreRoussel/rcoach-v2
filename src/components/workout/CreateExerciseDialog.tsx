import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateExercise } from '@/hooks/useExercises'
import type { Exercise } from '@/lib/graphql/operations'
import { EQUIPMENT, MUSCLE_GROUPS, inferExerciseMeta } from '@/lib/workout/exercise-meta'
import type { ExerciseTrackingMode } from '@/lib/workout/exercise-tracking'

type CreateExerciseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName?: string
  onCreated?: (exercise: Exercise) => void
}

export function CreateExerciseDialog({
  open,
  onOpenChange,
  initialName = '',
  onCreated,
}: CreateExerciseDialogProps) {
  const createExercise = useCreateExercise()
  const [name, setName] = useState(initialName)
  const [muscle, setMuscle] = useState<string>('full_body')
  const [equipment, setEquipment] = useState<string>('other')
  const [trackingMode, setTrackingMode] = useState<ExerciseTrackingMode>('auto')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const trimmed = initialName.trim()
    setName(trimmed)
    setError(null)
    setTrackingMode('auto')

    if (trimmed) {
      const inferred = inferExerciseMeta(trimmed)
      setMuscle(inferred.muscle_group)
      setEquipment(inferred.equipment)
    }
  }, [initialName, open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Le nom est obligatoire.')
      return
    }

    const inferred = inferExerciseMeta(trimmed)

    try {
      const exercise = await createExercise.mutateAsync({
        name: trimmed,
        muscle_group: muscle || inferred.muscle_group,
        equipment: equipment || inferred.equipment,
        is_public: false,
        tracking_mode: trackingMode,
      })

      if (!exercise) {
        setError('Impossible de créer cet exercice.')
        return
      }

      onCreated?.(exercise)
      onOpenChange(false)
    } catch {
      setError('Impossible de créer cet exercice.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-black">Nouvel exercice</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="create-exercise-name">Nom</Label>
            <Input
              id="create-exercise-name"
              value={name}
              onChange={(event) => {
                const value = event.target.value
                setName(value)
                const inferred = inferExerciseMeta(value)
                setMuscle(inferred.muscle_group)
                setEquipment(inferred.equipment)
              }}
              placeholder="Ex: Incline Dumbbell Press"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="create-exercise-muscle">Muscle</Label>
              <select
                id="create-exercise-muscle"
                className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
                value={muscle}
                onChange={(event) => setMuscle(event.target.value)}
              >
                {MUSCLE_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-exercise-equipment">Equipement</Label>
              <select
                id="create-exercise-equipment"
                className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
                value={equipment}
                onChange={(event) => setEquipment(event.target.value)}
              >
                {EQUIPMENT.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-exercise-tracking">Suivi</Label>
            <select
              id="create-exercise-tracking"
              className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
              value={trackingMode}
              onChange={(event) =>
                setTrackingMode(event.target.value as ExerciseTrackingMode)
              }
            >
              <option value="auto">Automatique</option>
              <option value="weighted">Charge + reps</option>
              <option value="bodyweight">Reps au poids du corps</option>
              <option value="timed">Durée (isométrique)</option>
            </select>
          </div>
          {error ? <FormMessage>{error}</FormMessage> : null}
          <Button type="submit" variant="pill" className="w-full" disabled={createExercise.isPending}>
            <Plus className="size-4" />
            {createExercise.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export type QuickAddValues = {
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

type QuickAddSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (values: QuickAddValues) => void
  isSubmitting?: boolean
}

function parseNutrient(value: string) {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function QuickAddSheet({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}: QuickAddSheetProps) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [fatG, setFatG] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setName('')
    setCalories('')
    setProteinG('')
    setCarbsG('')
    setFatG('')
    setError(null)
  }, [open])

  function handleSubmit() {
    if (!name.trim()) {
      setError('Le nom est obligatoire.')
      return
    }

    setError(null)
    onConfirm({
      name: name.trim(),
      calories: parseNutrient(calories),
      proteinG: parseNutrient(proteinG),
      carbsG: parseNutrient(carbsG),
      fatG: parseNutrient(fatG),
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Ajout rapide</SheetTitle>
          <SheetDescription>
            Saisissez les valeurs nutritionnelles sans créer d&apos;aliment en base.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="quick-add-name">Nom</Label>
            <Input
              id="quick-add-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex. Salade maison"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NutrientField
              id="quick-add-calories"
              label="Calories"
              value={calories}
              onChange={setCalories}
            />
            <NutrientField
              id="quick-add-protein"
              label="Protéines (g)"
              value={proteinG}
              onChange={setProteinG}
            />
            <NutrientField
              id="quick-add-carbs"
              label="Glucides (g)"
              value={carbsG}
              onChange={setCarbsG}
            />
            <NutrientField
              id="quick-add-fat"
              label="Lipides (g)"
              value={fatG}
              onChange={setFatG}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <SheetFooter className="px-4 pb-6">
          <Button
            type="button"
            className="w-full rounded-full"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Ajout...' : 'Ajouter au repas'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function NutrientField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
      />
    </div>
  )
}

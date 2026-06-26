import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parsePortionGramsInput } from '@/lib/nutrition/parse-portion-grams'

type FoodPortionTypeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (input: { portionName: string; portionSizeG: number }) => Promise<void>
  isPending?: boolean
}

export function FoodPortionTypeDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: FoodPortionTypeDialogProps) {
  const [portionName, setPortionName] = useState('')
  const [portionSizeG, setPortionSizeG] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setPortionName('')
      setPortionSizeG('')
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  async function handleConfirm() {
    const name = portionName.trim()
    const sizeG = parsePortionGramsInput(portionSizeG)

    if (!name) {
      setError('Indiquez un nom de portion.')
      return
    }

    if (sizeG <= 0) {
      setError('Indiquez une taille de portion supérieure à 0 g.')
      return
    }

    setError(null)
    try {
      await onConfirm({ portionName: name, portionSizeG: sizeG })
      handleOpenChange(false)
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : 'Impossible d’ajouter ce type de portion.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display font-black">Ajouter un type de portion</DialogTitle>
          <DialogDescription>
            Définissez un libellé et une taille en grammes pour ce produit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="portionName">Nom de la portion</Label>
            <Input
              id="portionName"
              placeholder="Ex. Tasse, Tranche, Pot..."
              value={portionName}
              onChange={(event) => setPortionName(event.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portionSizeG">Taille (g)</Label>
            <Input
              id="portionSizeG"
              value={portionSizeG}
              onChange={(event) => setPortionSizeG(event.target.value)}
              inputMode="decimal"
              placeholder="Ex. 30"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleConfirm()
                }
              }}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="pill" onClick={() => void handleConfirm()} disabled={isPending}>
            {isPending ? 'Ajout...' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

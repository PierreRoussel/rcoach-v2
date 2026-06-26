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
import { normalizeProposedFoodName } from '@/lib/nutrition/parse-portion-grams'

type FoodRenameProposalDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  onConfirm: (proposedName: string) => Promise<void>
  isPending?: boolean
}

export function FoodRenameProposalDialog({
  open,
  onOpenChange,
  currentName,
  onConfirm,
  isPending = false,
}: FoodRenameProposalDialogProps) {
  const [name, setName] = useState(currentName)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName(currentName)
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  async function handleConfirm() {
    const normalized = normalizeProposedFoodName(name)
    if (!normalized) {
      setError('Indiquez un nom proposé.')
      return
    }

    if (normalized === normalizeProposedFoodName(currentName)) {
      setError('Le nom proposé est identique au nom actuel.')
      return
    }

    setError(null)
    try {
      await onConfirm(normalized)
      handleOpenChange(false)
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : 'Impossible d’envoyer la proposition.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display font-black">Proposer un renommage</DialogTitle>
          <DialogDescription>
            Votre proposition sera examinée par un coach avant d’être appliquée au produit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="proposedFoodName">Nouveau nom</Label>
          <Input
            id="proposedFoodName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleConfirm()
              }
            }}
            autoFocus
          />
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
            {isPending ? 'Envoi...' : 'Envoyer la proposition'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useEffect, useState } from 'react'

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

type SessionNameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string) => Promise<void>
  isPending?: boolean
  title?: string
  description?: string
  placeholder?: string
  confirmLabel?: string
  defaultName?: string
}

export function SessionNameDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  title = 'Nouvelle séance',
  description = 'Donnez un nom à votre modèle avant de choisir les exercices.',
  placeholder = 'Push A, Upper, Legs...',
  confirmLabel = 'Continuer',
  defaultName = '',
}: SessionNameDialogProps) {
  const [name, setName] = useState(defaultName)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(defaultName)
      setError(null)
    }
  }, [open, defaultName])

  async function handleConfirm() {
    const trimmed = name.trim() || defaultName.trim()
    if (!trimmed) {
      setError('Indiquez un nom pour la séance.')
      return
    }

    setError(null)
    try {
      await onConfirm(trimmed)
      setName('')
      onOpenChange(false)
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : 'Impossible de créer la séance.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display font-black">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="sessionName">Nom</Label>
          <Input
            id="sessionName"
            placeholder={placeholder}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="pill" onClick={() => void handleConfirm()} disabled={isPending}>
            {isPending ? 'Enregistrement...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

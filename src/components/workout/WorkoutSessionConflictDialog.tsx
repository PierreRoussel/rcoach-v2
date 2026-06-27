import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type WorkoutSessionConflictDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSessionTitle: string
  nextSessionLabel: string
  onResume: () => void
  onAbandonAndStart: () => void
  isPending?: boolean
}

export function WorkoutSessionConflictDialog({
  open,
  onOpenChange,
  currentSessionTitle,
  nextSessionLabel,
  onResume,
  onAbandonAndStart,
  isPending = false,
}: WorkoutSessionConflictDialogProps) {
  const currentLabel = currentSessionTitle.trim() || 'Séance en cours'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Une séance est déjà en cours</DialogTitle>
          <DialogDescription>
            « {currentLabel} » est en cours. Que souhaitez-vous faire avant de
            démarrer « {nextSessionLabel} » ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
          <Button type="button" variant="pill" disabled={isPending} onClick={onResume}>
            Reprendre la séance en cours
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            disabled={isPending}
            onClick={onAbandonAndStart}
          >
            Démarrer et abandonner l&apos;ancienne
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type TemplateFrozenDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TemplateFrozenDialog({ open, onOpenChange }: TemplateFrozenDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-black">Modèle gelé</DialogTitle>
          <DialogDescription>
            Ce modèle est gelé car votre essai Premium est terminé. Seuls vos 6 modèles les plus
            utilisés restent actifs. Reprenez Premium pour le débloquer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button variant="pill" className="w-full" asChild>
            <Link to="/app/premium">Reprendre Premium</Link>
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

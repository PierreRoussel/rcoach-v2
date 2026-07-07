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
import { FREE_WORKOUT_TEMPLATES } from '@/lib/subscription/entitlements'

type TemplateLimitDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TemplateLimitDialog({ open, onOpenChange }: TemplateLimitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-black">
            Limite de modèles atteinte
          </DialogTitle>
          <DialogDescription>
            Le plan Gratuit permet de créer jusqu&apos;à {FREE_WORKOUT_TEMPLATES} modèles de
            séance. Passez en Premium pour en créer sans limite.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button variant="pill" className="w-full" asChild>
            <Link to="/app/premium">Voir les abonnements</Link>
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

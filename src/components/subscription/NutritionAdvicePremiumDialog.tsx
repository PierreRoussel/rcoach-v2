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
import { trackEvent } from '@/lib/analytics/track-event'

type NutritionAdvicePremiumDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NutritionAdvicePremiumDialog({
  open,
  onOpenChange,
}: NutritionAdvicePremiumDialogProps) {
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      trackEvent('nutrition_hint_locked_view')
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-black">
            Conseils nutrition Premium
          </DialogTitle>
          <DialogDescription>
            Le plan Gratuit permet de journaliser vos repas et suivre vos calories. Passez en
            Premium pour débloquer des conseils personnalisés sur vos apports.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button variant="pill" className="w-full" asChild>
            <Link
              to="/app/premium"
              onClick={() => trackEvent('nutrition_hint_premium_cta')}
            >
              Voir les abonnements
            </Link>
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

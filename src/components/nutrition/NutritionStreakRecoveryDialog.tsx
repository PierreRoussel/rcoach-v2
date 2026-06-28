import { Snowflake } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NutritionStreakRecoveryDialogProps = {
  open: boolean
  frozenStreak: number
  progress: number
  onOpenChange: (open: boolean) => void
}

export function NutritionStreakRecoveryDialog({
  open,
  frozenStreak,
  progress,
  onOpenChange,
}: NutritionStreakRecoveryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display font-black">
            <Snowflake className="size-5 text-sky-400" aria-hidden />
            Série gelée
          </DialogTitle>
          <DialogDescription className="text-left text-sm leading-relaxed">
            Votre série de{' '}
            <span className="font-semibold text-foreground">{frozenStreak} jours</span>{' '}
            est gelée. Loggez aujourd&apos;hui <strong>et</strong> demain pour la
            récupérer (+2 jours).
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 py-2">
          {[0, 1].map((step) => (
            <div
              key={step}
              className={cn(
                'flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold',
                progress > step
                  ? 'border-orange-400 bg-orange-400/20 text-orange-300'
                  : 'border-border text-muted-foreground',
              )}
            >
              {progress > step ? '✓' : step + 1}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Progression : {progress}/2
        </p>

        <DialogFooter>
          <Button type="button" className="w-full rounded-full" onClick={() => onOpenChange(false)}>
            Compris
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

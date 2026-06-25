import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type WeightGoalCalorieDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentCalories: number
  suggestedCalories: number
  goalLabel: string
  isSaving: boolean
  onAccept: () => void
  onDecline: () => void
}

export function WeightGoalCalorieDialog({
  open,
  onOpenChange,
  currentCalories,
  suggestedCalories,
  goalLabel,
  isSaving,
  onAccept,
  onDecline,
}: WeightGoalCalorieDialogProps) {
  const delta = suggestedCalories - currentCalories
  const deltaLabel =
    delta > 0 ? `+${delta}` : `${delta}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display font-black">
            Ajuster vos calories ?
          </DialogTitle>
          <DialogDescription>
            Votre objectif de {goalLabel.toLowerCase()} suggère une mise à jour
            de votre apport calorique quotidien.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Actuellement</span>
            <span className="font-semibold">{currentCalories} kcal/j</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Suggestion</span>
            <span className="font-semibold text-primary">
              {suggestedCalories} kcal/j ({deltaLabel})
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            disabled={isSaving}
            onClick={onDecline}
          >
            Garder mes calories
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={isSaving}
            onClick={onAccept}
          >
            Appliquer la suggestion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

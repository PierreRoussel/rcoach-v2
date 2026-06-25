import { NutritionCalendar } from '@/components/nutrition/NutritionCalendar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

type NutritionCalendarDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dailyTarget: number
  streak: number
}

export function NutritionCalendarDrawer({
  open,
  onOpenChange,
  dailyTarget,
  streak,
}: NutritionCalendarDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Serie nutrition</SheetTitle>
          <SheetDescription>
            Suivez vos jours avec au moins un aliment enregistre et vos objectifs caloriques.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          <NutritionCalendar dailyTarget={dailyTarget} streak={streak} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

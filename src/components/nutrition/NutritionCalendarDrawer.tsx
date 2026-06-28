import { NutritionCalendar } from '@/components/nutrition/NutritionCalendar'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type NutritionCalendarDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dailyTarget: number
  streak: number
  isFrozen?: boolean
  activeDate?: string
}

export function NutritionCalendarDrawer({
  open,
  onOpenChange,
  dailyTarget,
  streak,
  isFrozen = false,
  activeDate,
}: NutritionCalendarDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto rounded-t-2xl px-0">
        <DrawerHeader className="px-4 text-left">
          <DrawerTitle className="font-display font-black">Serie nutrition</DrawerTitle>
          <DrawerDescription>
            Suivez vos jours avec au moins un aliment enregistré et vos objectifs caloriques.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6">
          <NutritionCalendar
            dailyTarget={dailyTarget}
            streak={streak}
            isFrozen={isFrozen}
            activeDate={activeDate}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

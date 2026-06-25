import { Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useOverlayBackClose } from '@/hooks/useOverlayBackClose'
import { formatNutrient } from '@/lib/nutrition/nutrient-math'
import type { MealLogEntry } from '@/lib/nutrition/types'

type MealEntryDetailDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: MealLogEntry | null
  onEdit?: () => void
}

function formatEntryQuantity(entry: MealLogEntry) {
  if (entry.quantity_g != null) {
    return `${formatNutrient(entry.quantity_g)} g`
  }

  if (entry.servings != null) {
    return `${formatNutrient(entry.servings)} portion${entry.servings > 1 ? 's' : ''}`
  }

  return null
}

function MacroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-3 py-3 text-center">
      <div className="font-display text-xl font-black tabular-nums text-foreground">
        {formatNutrient(value)} g
      </div>
      <div className="mt-1 text-xs font-medium text-muted-foreground">{label}</div>
    </div>
  )
}

export function MealEntryDetailDrawer({
  open,
  onOpenChange,
  entry,
  onEdit,
}: MealEntryDetailDrawerProps) {
  const handleOpenChange = useOverlayBackClose(open, onOpenChange, 'meal-entry-detail-drawer')

  if (!entry) {
    return null
  }

  const quantityLabel = formatEntryQuantity(entry)
  const description = [entry.food.brand, quantityLabel].filter(Boolean).join(' · ')
  const macros = {
    carbs: Number(entry.carbs_g),
    protein: Number(entry.protein_g),
    fat: Number(entry.fat_g),
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} dismissible shouldScaleBackground={false}>
      <DrawerContent className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-0">
        <DrawerHeader className="px-4 text-left">
          <DrawerTitle className="font-display font-black">{entry.food.name}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-2">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-center">
            <div className="font-display text-4xl font-black tabular-nums text-foreground">
              {Math.round(Number(entry.calories))}
            </div>
            <div className="mt-1 text-sm font-medium text-muted-foreground">Calories</div>
            {quantityLabel ? (
              <div className="mt-2 text-xs text-muted-foreground">Pour {quantityLabel}</div>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MacroStat label="Glucides" value={macros.carbs} />
            <MacroStat label="Protéines" value={macros.protein} />
            <MacroStat label="Lipides" value={macros.fat} />
          </div>

          <div className="rounded-xl border border-border/70 bg-card px-3 py-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Valeurs pour 100 g</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              <div>
                <dt>Calories</dt>
                <dd className="font-data font-semibold text-foreground">
                  {Math.round(Number(entry.food.calories))} Cal
                </dd>
              </div>
              <div>
                <dt>Glucides</dt>
                <dd className="font-data font-semibold text-foreground">
                  {formatNutrient(Number(entry.food.carbs_g))} g
                </dd>
              </div>
              <div>
                <dt>Protéines</dt>
                <dd className="font-data font-semibold text-foreground">
                  {formatNutrient(Number(entry.food.protein_g))} g
                </dd>
              </div>
              <div>
                <dt>Lipides</dt>
                <dd className="font-data font-semibold text-foreground">
                  {formatNutrient(Number(entry.food.fat_g))} g
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {onEdit ? (
          <DrawerFooter className="px-4 pb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={() => {
                handleOpenChange(false)
                onEdit()
              }}
            >
              <Pencil className="size-4" />
              Modifier la portion
            </Button>
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}

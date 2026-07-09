import { Pencil, X } from 'lucide-react'

import { FoodFavoriteButton } from '@/components/nutrition/FoodFavoriteButton'
import { FoodItemDrawerMenu } from '@/components/nutrition/FoodItemDrawerMenu'
import { FoodMacroStat } from '@/components/nutrition/FoodMacroStat'
import { FoodNutrientBadges } from '@/components/nutrition/FoodNutrientBadges'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useFoodPortionTypes } from '@/hooks/useFoodRenameAndPortions'
import { formatNutrient } from '@/lib/nutrition/nutrient-math'
import { macroStatTextStyle } from '@/lib/nutrition/macro-visuals'
import { getMealEntryName, isQuickMealEntry, formatMealEntryQuantity } from '@/lib/nutrition/meal-entry-display'
import type { MealLogEntry } from '@/lib/nutrition/types'

type MealEntryDetailDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: MealLogEntry | null
  onEdit?: () => void
}

export function MealEntryDetailDrawer({
  open,
  onOpenChange,
  entry,
  onEdit,
}: MealEntryDetailDrawerProps) {
  const quickEntry = entry ? isQuickMealEntry(entry) : false
  const { data: portionTypes = [] } = useFoodPortionTypes(
    quickEntry ? null : (entry?.food?.id ?? null),
    open,
  )

  if (!entry) {
    return null
  }

  const quantityLabel = formatMealEntryQuantity(entry)
  const description = quickEntry
    ? 'Ajout rapide'
    : [entry.food?.brand, quantityLabel].filter(Boolean).join(' · ')
  const macros = {
    carbs: Number(entry.carbs_g),
    protein: Number(entry.protein_g),
    fat: Number(entry.fat_g),
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl px-0">
        <DrawerHeader className="shrink-0 space-y-0 px-4 text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <DrawerTitle className="font-display font-black">{getMealEntryName(entry)}</DrawerTitle>
              {description ? <DrawerDescription>{description}</DrawerDescription> : null}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {entry.food ? <FoodFavoriteButton foodId={entry.food.id} /> : null}
              {entry.food ? <FoodItemDrawerMenu food={entry.food} /> : null}
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  aria-label="Fermer"
                >
                  <X className="size-4" />
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain px-4 pb-2">
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
            <FoodMacroStat macro="carbs" label="Glucides" value={macros.carbs} />
            <FoodMacroStat
              macro="protein"
              label="Protéines"
              value={macros.protein}
              proteinPer100g={entry.food ? Number(entry.food.protein_g) : undefined}
            />
            <FoodMacroStat macro="fat" label="Lipides" value={macros.fat} />
          </div>

          {entry.food ? <FoodNutrientBadges food={entry.food} /> : null}

          {!quickEntry && portionTypes.length > 0 ? (
            <div className="rounded-xl border border-border/70 bg-card px-3 py-3 text-xs">
              <p className="font-semibold text-foreground">Types de portion</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {portionTypes.map((portion) => (
                  <li key={portion.id} className="flex items-center justify-between gap-2">
                    <span>{portion.portion_name}</span>
                    <span className="font-data font-semibold text-foreground">
                      {formatNutrient(Number(portion.portion_size_g))} g
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {entry.food ? (
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
                  <dd
                    className="font-data font-semibold"
                    style={macroStatTextStyle('carbs')}
                  >
                    {formatNutrient(Number(entry.food.carbs_g))} g
                  </dd>
                </div>
                <div>
                  <dt>Protéines</dt>
                  <dd
                    className="font-data font-semibold"
                    style={macroStatTextStyle('protein')}
                  >
                    {formatNutrient(Number(entry.food.protein_g))} g
                  </dd>
                </div>
                <div>
                  <dt>Lipides</dt>
                  <dd
                    className="font-data font-semibold"
                    style={macroStatTextStyle('fat')}
                  >
                    {formatNutrient(Number(entry.food.fat_g))} g
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>

        {onEdit && entry.food ? (
          <DrawerFooter className="shrink-0 border-t border-border/70 bg-background px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={() => {
                onOpenChange(false)
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

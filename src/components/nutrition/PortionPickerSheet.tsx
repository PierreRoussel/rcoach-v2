import { useEffect, useState } from 'react'

import { FoodMacroStat } from '@/components/nutrition/FoodMacroStat'
import { FoodNutrientBadges } from '@/components/nutrition/FoodNutrientBadges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatNutrient, scaleNutrientsPer100g, type PortionInput } from '@/lib/nutrition/nutrient-math'
import type { Food } from '@/lib/nutrition/types'

type PortionPickerSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  food: Food | null
  initialPortion?: PortionInput | null
  confirmLabel?: string
  onConfirm: (portion: PortionInput) => void
  isSubmitting?: boolean
}

function formatPortionFieldValue(value: number) {
  return formatNutrient(value)
}

function applyInitialPortion(
  food: Food,
  initialPortion: PortionInput | null | undefined,
  setMode: (mode: 'grams' | 'servings') => void,
  setGrams: (value: string) => void,
  setServings: (value: string) => void,
) {
  if (initialPortion?.mode === 'grams') {
    setMode('grams')
    setGrams(formatPortionFieldValue(initialPortion.quantityG))
    setServings('1')
    return
  }

  if (initialPortion?.mode === 'servings') {
    setMode('servings')
    setServings(formatPortionFieldValue(initialPortion.servings))
    setGrams(formatPortionFieldValue(Number(food.serving_size_g) || 100))
    return
  }

  setMode('grams')
  setGrams(formatPortionFieldValue(Number(food.serving_size_g) || 100))
  setServings('1')
}

export function PortionPickerSheet({
  open,
  onOpenChange,
  food,
  initialPortion = null,
  confirmLabel = 'Ajouter',
  onConfirm,
  isSubmitting = false,
}: PortionPickerSheetProps) {
  const [mode, setMode] = useState<'grams' | 'servings'>('grams')
  const [grams, setGrams] = useState('100')
  const [servings, setServings] = useState('1')

  useEffect(() => {
    if (!food || !open) {
      return
    }

    applyInitialPortion(food, initialPortion, setMode, setGrams, setServings)
  }, [food, initialPortion, open])

  if (!food) {
    return null
  }

  const preview = scaleNutrientsPer100g(
    food,
    mode === 'grams'
      ? { mode: 'grams', quantityG: Number(grams) || 0 }
      : { mode: 'servings', servings: Number(servings) || 0 },
  )

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] rounded-t-2xl">
        <DrawerHeader>
          <DrawerTitle>{food.name}</DrawerTitle>
          <DrawerDescription>
            {food.brand ? `${food.brand} · ` : ''}
            Choisissez la quantité à ajouter.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-4">
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'grams' | 'servings')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grams">Grammes</TabsTrigger>
              <TabsTrigger value="servings">Portions</TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === 'grams' ? (
            <div className="space-y-2">
              <Label htmlFor="grams">Quantité (g)</Label>
              <Input
                id="grams"
                value={grams}
                onChange={(event) => setGrams(event.target.value)}
                inputMode="decimal"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="servings">
                Nombre de portions ({food.serving_label || `${food.serving_size_g} g`})
              </Label>
              <Input
                id="servings"
                value={servings}
                onChange={(event) => setServings(event.target.value)}
                inputMode="decimal"
              />
            </div>
          )}

          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-center">
            <div className="font-display text-3xl font-black tabular-nums text-foreground">
              {Math.round(preview.calories)}
            </div>
            <div className="mt-1 text-sm font-medium text-muted-foreground">Calories</div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <FoodMacroStat label="Glucides" value={preview.carbsG} />
            <FoodMacroStat
              label="Protéines"
              value={preview.proteinG}
              proteinPer100g={Number(food.protein_g)}
            />
            <FoodMacroStat label="Lipides" value={preview.fatG} />
          </div>

          <FoodNutrientBadges food={food} />
        </div>

        <DrawerFooter className="px-4 pb-4">
          <Button
            type="button"
            className="w-full"
            disabled={isSubmitting}
            onClick={() =>
              onConfirm(
                mode === 'grams'
                  ? { mode: 'grams', quantityG: Number(grams) || 0 }
                  : { mode: 'servings', servings: Number(servings) || 0 },
              )
            }
          >
            {confirmLabel}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

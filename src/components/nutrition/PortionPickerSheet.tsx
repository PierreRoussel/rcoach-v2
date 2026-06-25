import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { scaleNutrientsPer100g } from '@/lib/nutrition/nutrient-math'
import type { Food } from '@/lib/nutrition/types'

type PortionPickerSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  food: Food | null
  onConfirm: (portion: { mode: 'grams'; quantityG: number } | { mode: 'servings'; servings: number }) => void
  isSubmitting?: boolean
}

export function PortionPickerSheet({
  open,
  onOpenChange,
  food,
  onConfirm,
  isSubmitting = false,
}: PortionPickerSheetProps) {
  const [mode, setMode] = useState<'grams' | 'servings'>('grams')
  const [grams, setGrams] = useState('100')
  const [servings, setServings] = useState('1')

  useEffect(() => {
    if (!food) {
      return
    }

    setMode('grams')
    setGrams(String(food.serving_size_g || 100))
    setServings('1')
  }, [food])

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{food.name}</SheetTitle>
          <SheetDescription>
            {food.brand ? `${food.brand} · ` : ''}
            Choisissez la quantité à ajouter.
          </SheetDescription>
        </SheetHeader>

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

          <div className="grid grid-cols-4 gap-2 rounded-2xl bg-muted/50 p-3 text-center text-sm">
            <div>
              <div className="font-bold">{Math.round(preview.calories)}</div>
              <div className="text-muted-foreground">Cal</div>
            </div>
            <div>
              <div className="font-bold">{preview.carbsG}</div>
              <div className="text-muted-foreground">Gluc.</div>
            </div>
            <div>
              <div className="font-bold">{preview.proteinG}</div>
              <div className="text-muted-foreground">Prot.</div>
            </div>
            <div>
              <div className="font-bold">{preview.fatG}</div>
              <div className="text-muted-foreground">Lip.</div>
            </div>
          </div>
        </div>

        <SheetFooter className="px-4 pb-4">
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
            Ajouter
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

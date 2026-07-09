import { useEffect, useMemo, useState } from 'react'

import { FoodFavoriteButton } from '@/components/nutrition/FoodFavoriteButton'
import { FoodMacroStat } from '@/components/nutrition/FoodMacroStat'
import { FoodNutrientBadges } from '@/components/nutrition/FoodNutrientBadges'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useFoodPortionTypes } from '@/hooks/useFoodRenameAndPortions'
import { formatNutrient, scaleNutrientsPer100g, type PortionInput } from '@/lib/nutrition/nutrient-math'
import {
  buildPortionOptions,
  portionInputFromOption,
  resolveDefaultPortionSelection,
  resolveInitialPortionOption,
  type PortionOption,
  type PortionOptionId,
} from '@/lib/nutrition/portion-options'
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

function formatPortionOptionLabel(option: PortionOption) {
  if (option.kind === 'grams') {
    return option.label
  }

  return `${option.label} (${formatNutrient(option.sizeG ?? 0)} g)`
}

function applyInitialSelection(
  food: Food,
  portionOptions: PortionOption[],
  initialPortion: PortionInput | null | undefined,
  portionTypes: ReturnType<typeof useFoodPortionTypes>['data'],
  setSelectedOptionId: (id: PortionOptionId) => void,
  setQuantity: (value: string) => void,
) {
  const fallback = resolveDefaultPortionSelection(food, portionOptions)

  if (!initialPortion) {
    setSelectedOptionId(fallback.optionId)
    setQuantity(formatPortionFieldValue(fallback.quantity))
    return
  }

  const resolved = resolveInitialPortionOption(initialPortion, food, portionTypes ?? [])
  const hasOption = portionOptions.some((option) => option.id === resolved.optionId)
  const fallbackOptionId = fallback.optionId
  const quantity = Number.isFinite(resolved.quantity) ? resolved.quantity : fallback.quantity

  setSelectedOptionId(hasOption ? resolved.optionId : fallbackOptionId)
  setQuantity(formatPortionFieldValue(quantity))
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
  const { data: portionTypes = [] } = useFoodPortionTypes(food?.id ?? null, open)
  const portionOptions = useMemo(
    () => (food ? buildPortionOptions(food, portionTypes) : []),
    [food, portionTypes],
  )
  const [selectedOptionId, setSelectedOptionId] = useState<PortionOptionId>('default')
  const [quantity, setQuantity] = useState('1')

  const selectedOption =
    portionOptions.find((option) => option.id === selectedOptionId) ?? portionOptions[0]

  useEffect(() => {
    if (!food || !open) {
      return
    }

    applyInitialSelection(
      food,
      portionOptions,
      initialPortion,
      portionTypes,
      setSelectedOptionId,
      setQuantity,
    )
  }, [food, initialPortion, open, portionOptions, portionTypes])

  if (!food || !selectedOption) {
    return null
  }

  const portion = portionInputFromOption(selectedOption, Number(quantity) || 0, food)
  const preview = scaleNutrientsPer100g(food, portion)
  const quantityLabel =
    selectedOption.kind === 'grams'
      ? 'Quantité (g)'
      : `Nombre de ${selectedOption.label} (${formatNutrient(selectedOption.sizeG ?? 0)} g)`

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl">
        <DrawerHeader className="shrink-0 px-4 text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <DrawerTitle>{food.name}</DrawerTitle>
              <DrawerDescription>
                {food.brand ? `${food.brand} · ` : ''}
                Choisissez la quantité à ajouter.
              </DrawerDescription>
            </div>
            <FoodFavoriteButton foodId={food.id} />
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain px-4 pb-2">
          <ScrollArea className="w-full whitespace-nowrap">
            <ToggleGroup
              type="single"
              variant="outline"
              value={selectedOptionId}
              onValueChange={(value) => {
                if (value) {
                  setSelectedOptionId(value as PortionOptionId)
                }
              }}
              className="inline-flex w-max min-w-full rounded-xl"
            >
              {portionOptions.map((option) => (
                <ToggleGroupItem
                  key={option.id}
                  value={option.id}
                  className="shrink-0 px-3"
                  aria-label={formatPortionOptionLabel(option)}
                >
                  {formatPortionOptionLabel(option)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="space-y-2">
            <Label htmlFor="portion-quantity">{quantityLabel}</Label>
            <QuantityStepper
              id="portion-quantity"
              value={quantity}
              onChange={setQuantity}
              step={selectedOption.kind === 'grams' ? 10 : 1}
              decrementLabel="Diminuer la quantité"
              incrementLabel="Augmenter la quantité"
            />
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-center">
            <div className="font-display text-3xl font-black tabular-nums text-foreground">
              {Math.round(preview.calories)}
            </div>
            <div className="mt-1 text-sm font-medium text-muted-foreground">Calories</div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <FoodMacroStat macro="carbs" label="Glucides" value={preview.carbsG} />
            <FoodMacroStat
              macro="protein"
              label="Protéines"
              value={preview.proteinG}
              proteinPer100g={Number(food.protein_g)}
            />
            <FoodMacroStat macro="fat" label="Lipides" value={preview.fatG} />
          </div>

          <FoodNutrientBadges food={food} />
        </div>

        <DrawerFooter className="shrink-0 border-t border-border/70 bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            className="w-full"
            disabled={isSubmitting}
            onClick={() => onConfirm(portionInputFromOption(selectedOption, Number(quantity) || 0, food))}
          >
            {confirmLabel}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

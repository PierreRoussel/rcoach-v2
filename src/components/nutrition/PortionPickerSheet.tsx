import { useEffect, useMemo, useState } from 'react'

import { FoodMacroStat } from '@/components/nutrition/FoodMacroStat'
import { FoodNutrientBadges } from '@/components/nutrition/FoodNutrientBadges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const fallbackOptionId = portionOptions[0]?.id ?? 'grams'
  const fallbackQuantity = formatPortionFieldValue(Number(food.serving_size_g) || 100)

  if (!initialPortion) {
    setSelectedOptionId(fallbackOptionId)
    setQuantity(fallbackQuantity)
    return
  }

  const resolved = resolveInitialPortionOption(initialPortion, food, portionTypes ?? [])
  const hasOption = portionOptions.some((option) => option.id === resolved.optionId)

  setSelectedOptionId(hasOption ? resolved.optionId : fallbackOptionId)
  setQuantity(formatPortionFieldValue(resolved.quantity))
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
  const [selectedOptionId, setSelectedOptionId] = useState<PortionOptionId>('grams')
  const [quantity, setQuantity] = useState('100')

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

          {selectedOption.kind === 'grams' ? (
            <div className="space-y-2">
              <Label htmlFor="portion-quantity">Quantité (g)</Label>
              <Input
                id="portion-quantity"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                inputMode="decimal"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="portion-quantity">
                Nombre de {selectedOption.label} ({formatNutrient(selectedOption.sizeG ?? 0)} g)
              </Label>
              <Input
                id="portion-quantity"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
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
            onClick={() => onConfirm(portionInputFromOption(selectedOption, Number(quantity) || 0, food))}
          >
            {confirmLabel}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

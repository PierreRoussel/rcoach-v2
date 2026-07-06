import type { FoodPortionType } from '@/hooks/useFoodRenameAndPortions'
import type { PortionInput } from '@/lib/nutrition/nutrient-math'
import type { Food } from '@/lib/nutrition/types'

export type PortionOptionId = 'grams' | 'default' | string

export type PortionOption = {
  id: PortionOptionId
  label: string
  sizeG: number | null
  kind: 'grams' | 'portion'
}

function isWholeNumberRatio(value: number) {
  return value > 0 && Math.abs(value - Math.round(value)) < 0.001
}

export function buildPortionOptions(
  food: Pick<Food, 'serving_size_g' | 'serving_label'>,
  portionTypes: FoodPortionType[],
): PortionOption[] {
  const options: PortionOption[] = [
    { id: 'grams', label: 'Grammes', sizeG: null, kind: 'grams' },
    {
      id: 'default',
      label: food.serving_label || `${food.serving_size_g} g`,
      sizeG: Number(food.serving_size_g),
      kind: 'portion',
    },
  ]

  for (const portionType of portionTypes) {
    options.push({
      id: portionType.id,
      label: portionType.portion_name,
      sizeG: Number(portionType.portion_size_g),
      kind: 'portion',
    })
  }

  return options
}

export function portionInputFromOption(
  option: PortionOption,
  quantity: number,
  food: Pick<Food, 'serving_size_g'>,
): PortionInput {
  if (option.kind === 'grams') {
    return { mode: 'grams', quantityG: quantity }
  }

  if (option.id === 'default') {
    return { mode: 'servings', servings: quantity }
  }

  return {
    mode: 'servings',
    servings: quantity,
    servingSizeG: option.sizeG ?? Number(food.serving_size_g),
  }
}

export function resolveInitialPortionOption(
  portion: PortionInput,
  food: Pick<Food, 'serving_size_g'>,
  portionTypes: FoodPortionType[],
): { optionId: PortionOptionId; quantity: number } {
  if (portion.mode === 'grams') {
    for (const portionType of portionTypes) {
      const sizeG = Number(portionType.portion_size_g)
      if (sizeG > 0) {
        const count = portion.quantityG / sizeG
        if (isWholeNumberRatio(count)) {
          return { optionId: portionType.id, quantity: Math.round(count) }
        }
      }
    }

    const defaultSizeG = Number(food.serving_size_g)
    if (defaultSizeG > 0) {
      const count = portion.quantityG / defaultSizeG
      if (isWholeNumberRatio(count)) {
        return { optionId: 'default', quantity: Math.round(count) }
      }
    }

    return { optionId: 'grams', quantity: portion.quantityG }
  }

  if (portion.servingSizeG != null) {
    const defaultSizeG = Number(food.serving_size_g)
    if (portion.servingSizeG !== defaultSizeG) {
      const match = portionTypes.find(
        (portionType) => Number(portionType.portion_size_g) === portion.servingSizeG,
      )
      if (match) {
        return { optionId: match.id, quantity: portion.servings }
      }
    }
  }

  return { optionId: 'default', quantity: portion.servings }
}

export function portionToStoredFields(
  food: Pick<Food, 'serving_size_g'>,
  portion: PortionInput,
): { quantity_g: number | null; servings: number | null } {
  if (portion.mode === 'grams') {
    return { quantity_g: portion.quantityG, servings: null }
  }

  const servingSizeG = portion.servingSizeG ?? Number(food.serving_size_g)
  const defaultServingSizeG = Number(food.serving_size_g)

  if (portion.servingSizeG != null && servingSizeG !== defaultServingSizeG) {
    return { quantity_g: portion.servings * servingSizeG, servings: null }
  }

  return { quantity_g: null, servings: portion.servings }
}

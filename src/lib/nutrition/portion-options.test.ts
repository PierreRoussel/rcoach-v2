import { describe, expect, it } from 'vitest'

import {
  buildPortionOptions,
  portionInputFromOption,
  portionToStoredFields,
  resolveDefaultPortionSelection,
  resolveInitialPortionOption,
} from '@/lib/nutrition/portion-options'

const food = {
  serving_size_g: 100,
  serving_label: 'pot',
}

const portionTypes = [
  {
    id: 'slice-1',
    portion_name: 'tranche',
    portion_size_g: 30,
    created_at: '',
  },
]

describe('buildPortionOptions', () => {
  it('includes grams, default portion, and custom portion types', () => {
    expect(buildPortionOptions(food, portionTypes)).toEqual([
      { id: 'grams', label: 'Grammes', sizeG: null, kind: 'grams' },
      { id: 'default', label: 'pot', sizeG: 100, kind: 'portion' },
      { id: 'slice-1', label: 'tranche', sizeG: 30, kind: 'portion' },
    ])
  })
})

describe('portionInputFromOption', () => {
  it('maps grams and default portion options', () => {
    const options = buildPortionOptions(food, portionTypes)

    expect(portionInputFromOption(options[0]!, 120, food)).toEqual({
      mode: 'grams',
      quantityG: 120,
    })
    expect(portionInputFromOption(options[1]!, 2, food)).toEqual({
      mode: 'servings',
      servings: 2,
    })
  })

  it('maps custom portion types with servingSizeG', () => {
    const options = buildPortionOptions(food, portionTypes)

    expect(portionInputFromOption(options[2]!, 3, food)).toEqual({
      mode: 'servings',
      servings: 3,
      servingSizeG: 30,
    })
  })
})

describe('resolveDefaultPortionSelection', () => {
  it('defaults to one serving of the food portion', () => {
    const options = buildPortionOptions(food, portionTypes)

    expect(resolveDefaultPortionSelection(food, options)).toEqual({
      optionId: 'default',
      quantity: 1,
    })
  })
})

describe('resolveInitialPortionOption', () => {
  it('resolves servings and custom serving sizes', () => {
    expect(resolveInitialPortionOption({ mode: 'servings', servings: 2 }, food, portionTypes)).toEqual({
      optionId: 'default',
      quantity: 2,
    })
    expect(
      resolveInitialPortionOption(
        { mode: 'servings', servings: 3, servingSizeG: 30 },
        food,
        portionTypes,
      ),
    ).toEqual({
      optionId: 'slice-1',
      quantity: 3,
    })
  })

  it('infers portion types from stored grams when possible', () => {
    expect(resolveInitialPortionOption({ mode: 'grams', quantityG: 90 }, food, portionTypes)).toEqual({
      optionId: 'slice-1',
      quantity: 3,
    })
    expect(resolveInitialPortionOption({ mode: 'grams', quantityG: 155 }, food, portionTypes)).toEqual({
      optionId: 'grams',
      quantity: 155,
    })
  })
})

describe('portionToStoredFields', () => {
  it('stores default servings as servings', () => {
    expect(portionToStoredFields(food, { mode: 'servings', servings: 2 })).toEqual({
      quantity_g: null,
      servings: 2,
    })
  })

  it('stores custom portion servings as quantity_g', () => {
    expect(
      portionToStoredFields(food, { mode: 'servings', servings: 2, servingSizeG: 30 }),
    ).toEqual({
      quantity_g: 60,
      servings: null,
    })
  })

  it('stores grams directly', () => {
    expect(portionToStoredFields(food, { mode: 'grams', quantityG: 75 })).toEqual({
      quantity_g: 75,
      servings: null,
    })
  })
})

#!/usr/bin/env node

import {
  buildFoodInsertQuery,
  mapLiteProductToFoodRow,
} from './lib/off-france-import.mjs'

const sample = {
  code: '3017620422003',
  product_name: 'Nutella',
  brands: 'Ferrero',
  nutriments: {
    'energy-kcal_100g': 539,
    carbohydrates_100g: 57.5,
    proteins_100g: 6.3,
    fat_100g: 30.9,
    salt_100g: 0.1,
    sugars_100g: 56.3,
    'saturated-fat_100g': 10.6,
  },
  serving_size: '400 g',
  serving_quantity: 400,
}

const row = mapLiteProductToFoodRow(sample)
if (!row) {
  throw new Error('Expected mapped row')
}

if (row.off_product_id !== '3017620422003' || row.source !== 'open_food_facts') {
  throw new Error('Unexpected mapped identity fields')
}

if (row.serving_size_g !== 400 || row.serving_label !== '400 g') {
  throw new Error('Unexpected serving fields')
}

const query = buildFoodInsertQuery([row])
if (!query?.text.includes('ON CONFLICT') || query.values.length !== 15) {
  throw new Error('Unexpected insert query')
}

console.log('OFF import mapping test OK.')

const badCalories = mapLiteProductToFoodRow({
  code: '0832958000661',
  product_name: 'India Pale Ale',
  nutriments: {
    'energy-kcal_100g': 14_232_696_253_056_154,
    carbohydrates_100g: 6.3,
    proteins_100g: 0,
    fat_100g: 0,
  },
})
if (badCalories != null) {
  throw new Error('Expected invalid calories row to be rejected')
}

const hugeServing = mapLiteProductToFoodRow({
  code: '3276440178785',
  product_name: 'Cacher halal',
  nutriments: {
    'energy-kcal_100g': 250,
    carbohydrates_100g: 0,
    proteins_100g: 20,
    fat_100g: 18,
  },
  serving_quantity: 3_760_275_860_057,
})
if (!hugeServing || hugeServing.serving_size_g !== 100) {
  throw new Error('Expected huge serving size to fall back to 100 g')
}

console.log('OFF import bounds test OK.')

#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  filterOffFranceCsvRow,
  mightMatchOffFranceCsvLine,
  parseTsvLine,
  validateCsvHeader,
} from './lib/off-france-csv.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))

const header = [
  'code',
  'product_name',
  'generic_name',
  'brands',
  'countries',
  'countries_tags',
  'no_nutrition_data',
  'energy-kcal_100g',
  'carbohydrates_100g',
  'proteins_100g',
  'fat_100g',
  'salt_100g',
  'sugars_100g',
  'saturated-fat_100g',
  'serving_size',
  'serving_quantity',
].join('\t')

const rows = [
  [
    '3017620422003',
    'Nutella',
    '',
    'Ferrero',
    'France',
    'en:france,en:european-union',
    '',
    '539',
    '57.5',
    '6.3',
    '30.9',
    '0.1',
    '56.3',
    '10.6',
    '400 g',
    '400',
  ].join('\t'),
  [
    '0000000000001',
    'Tea',
    '',
    'Brand',
    'Germany',
    'en:germany',
    '',
    '1',
    '0.2',
    '0',
    '0',
    '',
    '',
    '',
    '',
    '',
  ].join('\t'),
  [
    '0000000000002',
    '',
    '',
    '',
    'France',
    'en:france',
    '',
    '100',
    '10',
    '5',
    '2',
    '',
    '',
    '',
    '',
    '',
  ].join('\t'),
]

mkdirSync(resolve(repoRoot, 'scripts/.tmp'), { recursive: true })
const samplePath = resolve(repoRoot, 'scripts/.tmp/off-sample.csv')
writeFileSync(samplePath, `${header}\n${rows.join('\n')}\n`, 'utf8')

const columnMap = validateCsvHeader(parseTsvLine(header))
let kept = 0

for (const row of rows) {
  if (!mightMatchOffFranceCsvLine(row)) {
    continue
  }

  const product = filterOffFranceCsvRow(parseTsvLine(row), columnMap)
  if (product) {
    kept += 1
    if (product.code !== '3017620422003') {
      throw new Error(`Unexpected kept product: ${product.code}`)
    }
  }
}

if (kept !== 1) {
  throw new Error(`Expected 1 kept product, got ${kept}`)
}

console.log('CSV filter test OK (1 product kept from sample).')

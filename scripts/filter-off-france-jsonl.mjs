#!/usr/bin/env node

import { createReadStream, createWriteStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { finished } from 'node:stream/promises'
import { createGunzip, createGzip } from 'node:zlib'
import { parseArgs } from 'node:util'

import { filterOffFranceLiteLine } from '../src/lib/nutrition/off-france-filter.ts'

const PROGRESS_EVERY_LINES = 100_000

function printHelp() {
  console.log(`Usage:
  node scripts/filter-off-france-jsonl.mjs --input <path> --output <path> [options]

Filters the global Open Food Facts JSONL export to a lightweight France subset:
  - sold in France (countries_tags or countries field)
  - non-empty product name
  - macronutrients per 100g: kcal, carbs, protein, fat

Options:
  --input, -i     Input .jsonl or .jsonl.gz file (required)
  --output, -o    Output .jsonl or .jsonl.gz file (required)
  --gzip-in       Force gzip input even without .gz extension
  --gzip-out      Force gzip output even without .gz extension
  --help, -h      Show this help

Example:
  node scripts/filter-off-france-jsonl.mjs \\
    --input ./data/openfoodfacts-products.jsonl.gz \\
    --output ./data/off-france-lite.jsonl
`)
}

function resolveArgs() {
  const { values } = parseArgs({
    options: {
      input: { type: 'string', short: 'i' },
      output: { type: 'string', short: 'o' },
      'gzip-in': { type: 'boolean', default: false },
      'gzip-out': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: false,
  })

  if (values.help) {
    printHelp()
    process.exit(0)
  }

  if (!values.input || !values.output) {
    printHelp()
    process.exit(1)
  }

  return {
    inputPath: values.input,
    outputPath: values.output,
    gzipIn: values['gzip-in'] || values.input.endsWith('.gz'),
    gzipOut: values['gzip-out'] || values.output.endsWith('.gz'),
  }
}

function createInputStream(inputPath, gzipIn) {
  const fileStream = createReadStream(inputPath)
  return gzipIn ? fileStream.pipe(createGunzip()) : fileStream
}

function createOutputStream(outputPath, gzipOut) {
  const fileStream = createWriteStream(outputPath)
  return gzipOut ? fileStream.pipe(createGzip()) : fileStream
}

async function main() {
  const { inputPath, outputPath, gzipIn, gzipOut } = resolveArgs()

  const inputStream = createInputStream(inputPath, gzipIn)
  const outputStream = createOutputStream(outputPath, gzipOut)
  const lineReader = createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  })

  const stats = {
    totalLines: 0,
    kept: 0,
    skipped: 0,
  }

  const startedAt = Date.now()

  for await (const line of lineReader) {
    stats.totalLines += 1

    if (stats.totalLines % PROGRESS_EVERY_LINES === 0) {
      const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(0)
      console.error(
        `[off-filter] ${stats.totalLines.toLocaleString('fr-FR')} lines read, ${stats.kept.toLocaleString('fr-FR')} kept (${elapsedSec}s)`,
      )
    }

    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const liteProduct = filterOffFranceLiteLine(trimmed)
    if (!liteProduct) {
      stats.skipped += 1
      continue
    }

    stats.kept += 1
    outputStream.write(`${JSON.stringify(liteProduct)}\n`)
  }

  outputStream.end()
  await finished(outputStream)

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.error(
    [
      '[off-filter] Done.',
      `Input: ${inputPath}`,
      `Output: ${outputPath}`,
      `Lines read: ${stats.totalLines.toLocaleString('fr-FR')}`,
      `Kept: ${stats.kept.toLocaleString('fr-FR')}`,
      `Skipped: ${stats.skipped.toLocaleString('fr-FR')}`,
      `Duration: ${elapsedSec}s`,
    ].join('\n'),
  )
}

main().catch((error) => {
  console.error('[off-filter] Failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})

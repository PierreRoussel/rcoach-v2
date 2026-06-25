#!/usr/bin/env node

import { createReadStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  filterOffFranceLiteLine,
  mightMatchOffFranceLine,
} from './lib/off-france-filter.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const samplePath = resolve(repoRoot, 'scripts/.tmp/off-sample-5000.jsonl')
const slowOutputPath = resolve(repoRoot, 'scripts/.tmp/off-sample-slow.jsonl')
const fastOutputPath = resolve(repoRoot, 'scripts/.tmp/off-sample-fast.jsonl')
const sourcePath = process.env.OFF_SAMPLE_SOURCE ?? 'E:/off/openfoodfacts-products.jsonl'
const sampleLines = Number(process.env.OFF_SAMPLE_LINES ?? 5000)

function loadCodes(path) {
  const content = readFileSync(path, 'utf8').trim()
  if (!content) {
    return []
  }

  return content
    .split('\n')
    .map((line) => JSON.parse(line).code)
    .sort()
}

async function buildSample() {
  mkdirSync(resolve(repoRoot, 'scripts/.tmp'), { recursive: true })

  const input = createReadStream(sourcePath)
  const reader = createInterface({ input, crlfDelay: Infinity })
  const lines = []

  for await (const line of reader) {
    lines.push(line)
    if (lines.length >= sampleLines) {
      break
    }
  }

  if (lines.length === 0) {
    throw new Error(`Impossible de lire ${sourcePath}`)
  }

  writeFileSync(samplePath, `${lines.join('\n')}\n`, 'utf8')
  return lines.length
}

async function verifyPrefilter(sampleFile) {
  const reader = createInterface({
    input: createReadStream(sampleFile),
    crlfDelay: Infinity,
  })

  for await (const line of reader) {
    const kept = filterOffFranceLiteLine(line)
    if (kept && !mightMatchOffFranceLine(line)) {
      throw new Error(`Prefilter false negative for code ${kept.code}`)
    }
  }
}

function runScript(scriptName, args) {
  const result = spawnSync(process.execPath, [resolve(repoRoot, scriptName), ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  if (result.status !== 0) {
    throw new Error(
      `${scriptName} failed (${result.status}): ${result.stderr || result.stdout}`,
    )
  }

  return result.stderr
}

async function main() {
  console.log(`Building sample (${sampleLines} lines) from ${sourcePath}...`)
  const builtLines = await buildSample()
  console.log(`Sample ready: ${samplePath} (${builtLines} lines)`)

  console.log('Checking prefilter safety...')
  await verifyPrefilter(samplePath)
  console.log('Prefilter OK (no false negatives on sample).')

  console.log('Running slow script...')
  const slowLog = runScript('scripts/filter-off-france-jsonl.mjs', [
    '--input',
    samplePath,
    '--output',
    slowOutputPath,
  ])

  console.log('Running fast script...')
  const fastLog = runScript('scripts/filter-off-france-jsonl-fast.mjs', [
    '--input',
    samplePath,
    '--output',
    fastOutputPath,
    '--workers',
    String(Math.max(2, Number(process.env.OFF_TEST_WORKERS ?? 4))),
  ])

  const slowCodes = loadCodes(slowOutputPath)
  const fastCodes = loadCodes(fastOutputPath)

  if (slowCodes.length !== fastCodes.length) {
    throw new Error(
      `Output size mismatch: slow=${slowCodes.length}, fast=${fastCodes.length}`,
    )
  }

  for (let index = 0; index < slowCodes.length; index += 1) {
    if (slowCodes[index] !== fastCodes[index]) {
      throw new Error(
        `Output mismatch at index ${index}: slow=${slowCodes[index]}, fast=${fastCodes[index]}`,
      )
    }
  }

  const slowDuration = Number(slowLog.match(/Duration: ([0-9.]+)s/)?.[1] ?? NaN)
  const fastDuration = Number(fastLog.match(/Duration: ([0-9.]+)s/)?.[1] ?? NaN)
  const speedup =
    Number.isFinite(slowDuration) && Number.isFinite(fastDuration) && fastDuration > 0
      ? (slowDuration / fastDuration).toFixed(2)
      : 'n/a'

  console.log('Equivalence OK: slow and fast outputs match exactly.')
  console.log(`Kept products: ${slowCodes.length}`)
  console.log(`Slow duration: ${slowDuration}s`)
  console.log(`Fast duration: ${fastDuration}s`)
  console.log(`Speedup: ${speedup}x`)
}

main().catch((error) => {
  console.error('Test failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})

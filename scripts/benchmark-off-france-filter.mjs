#!/usr/bin/env node

import { createReadStream, createWriteStream, existsSync, statSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { finished } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const inputPath = process.env.OFF_BENCH_INPUT ?? 'E:/off/openfoodfacts-products.jsonl'
const benchLines = Number(process.env.OFF_BENCH_LINES ?? 100000)
const workers = String(process.env.OFF_BENCH_WORKERS ?? Math.max(2, Number(process.env.OFF_TEST_WORKERS ?? 4)))

async function writeSample(limit, samplePath) {
  mkdirSync(resolve(repoRoot, 'scripts/.tmp'), { recursive: true })

  const reader = createInterface({
    input: createReadStream(inputPath),
    crlfDelay: Infinity,
  })
  const writer = createWriteStream(samplePath, { flags: 'w' })

  let count = 0
  for await (const line of reader) {
    writer.write(`${line}\n`)
    count += 1
    if (count >= limit) {
      break
    }
  }

  writer.end()
  await finished(writer)
  return count
}

function run(script, args) {
  const startedAt = Date.now()
  const result = spawnSync(process.execPath, [resolve(repoRoot, script), ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  const elapsedMs = Date.now() - startedAt

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout)
  }

  const kept = Number(result.stderr.match(/Kept: ([0-9 ,]+)/)?.[1]?.replace(/\s/g, '') ?? NaN)

  return { elapsedMs, kept, stderr: result.stderr }
}

async function main() {
  if (!existsSync(inputPath)) {
    throw new Error(`Input not found: ${inputPath}`)
  }

  const samplePath = resolve(repoRoot, 'scripts/.tmp/off-bench-sample.jsonl')
  const slowOutput = resolve(repoRoot, 'scripts/.tmp/off-bench-slow.jsonl')
  const fastOutput = resolve(repoRoot, 'scripts/.tmp/off-bench-fast.jsonl')

  console.log(`Building sample (${benchLines.toLocaleString('fr-FR')} lines)...`)
  const lineCount = await writeSample(benchLines, samplePath)
  console.log(
    `Sample ready: ${(statSync(samplePath).size / 1024 / 1024).toFixed(1)} MB (${lineCount} lines)`,
  )

  console.log('Benchmarking slow script...')
  const slow = run('scripts/filter-off-france-jsonl.mjs', [
    '--input',
    samplePath,
    '--output',
    slowOutput,
  ])

  console.log('Benchmarking fast script...')
  const fast = run('scripts/filter-off-france-jsonl-fast.mjs', [
    '--input',
    samplePath,
    '--output',
    fastOutput,
    '--workers',
    workers,
  ])

  const speedup = (slow.elapsedMs / fast.elapsedMs).toFixed(2)
  console.log('')
  console.log(`Lines: ${lineCount.toLocaleString('fr-FR')}`)
  console.log(
    `Slow: ${(slow.elapsedMs / 1000).toFixed(1)}s (${Math.round(lineCount / (slow.elapsedMs / 1000))} lines/s)`,
  )
  console.log(
    `Fast: ${(fast.elapsedMs / 1000).toFixed(1)}s (${Math.round(lineCount / (fast.elapsedMs / 1000))} lines/s)`,
  )
  console.log(`Speedup: ${speedup}x`)
  console.log(`Kept (slow/fast): ${slow.kept} / ${fast.kept}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

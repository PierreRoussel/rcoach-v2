#!/usr/bin/env node

import {
  closeSync,
  createReadStream,
  createWriteStream,
  existsSync,
  openSync,
  readSync,
  statSync,
  unlinkSync,
} from 'node:fs'
import { createInterface } from 'node:readline'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { finished } from 'node:stream/promises'
import { availableParallelism } from 'node:os'
import { parseArgs } from 'node:util'
import { Worker } from 'node:worker_threads'
import { createGunzip } from 'node:zlib'

const PROGRESS_EVERY_LINES = 100_000
const WORKER_URL = new URL('./lib/off-france-filter-chunk-worker.mjs', import.meta.url)

function printHelp() {
  console.log(`Usage:
  node scripts/filter-off-france-jsonl-fast.mjs --input <path> --output <path> [options]

Fast parallel filter for Open Food Facts JSONL (same output as filter-off-france-jsonl.mjs).

Options:
  --input, -i       Input .jsonl file (required; .gz uses single worker)
  --output, -o      Output .jsonl file (required)
  --workers, -w     Worker count (default: CPU count - 1, min 1)
  --help, -h        Show this help

Example:
  node scripts/filter-off-france-jsonl-fast.mjs \\
    -i E:/off/openfoodfacts-products.jsonl \\
    -o E:/off/off-france-lite.jsonl \\
    -w 8
`)
}

function resolveArgs() {
  const { values } = parseArgs({
    options: {
      input: { type: 'string', short: 'i' },
      output: { type: 'string', short: 'o' },
      workers: { type: 'string', short: 'w' },
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

  const defaultWorkers = Math.max(1, availableParallelism() - 1)
  const workers = values.workers ? Math.max(1, Number(values.workers)) : defaultWorkers

  return {
    inputPath: resolve(values.input),
    outputPath: resolve(values.output),
    workers: Number.isFinite(workers) ? workers : defaultWorkers,
    gzipIn: values.input.endsWith('.gz'),
  }
}

function resolveExistingPath(rawPath, label) {
  if (!existsSync(rawPath)) {
    throw new Error(`${label} introuvable: ${rawPath}`)
  }
  return rawPath
}

function ensureOutputDirectory(outputPath) {
  const outputDir = dirname(outputPath)
  if (!existsSync(outputDir)) {
    throw new Error(`Dossier de sortie introuvable: ${outputDir}`)
  }
}

function findNewlineAlignedBoundaries(inputPath, workerCount) {
  const { size } = statSync(inputPath)
  if (size === 0) {
    return [0, 0]
  }

  const boundaries = [0]
  const fd = openSync(inputPath, 'r')
  const byte = Buffer.alloc(1)

  try {
    for (let index = 1; index < workerCount; index += 1) {
      let position = Math.floor((size * index) / workerCount)

      while (position < size) {
        readSync(fd, byte, 0, 1, position)
        if (byte[0] === 0x0a) {
          boundaries.push(position + 1)
          break
        }
        position += 1
      }

      if (position >= size) {
        boundaries.push(size)
        break
      }
    }
  } finally {
    closeSync(fd)
  }

  if (boundaries[boundaries.length - 1] !== size) {
    boundaries.push(size)
  }

  return boundaries
}

function runWorker(workerUrl, workerData) {
  return new Promise((resolveWorker, rejectWorker) => {
    const worker = new Worker(workerUrl, { workerData })
    let settled = false

    worker.on('message', (message) => {
      if (message.error) {
        settled = true
        rejectWorker(new Error(message.error))
        return
      }
      settled = true
      resolveWorker(message)
    })

    worker.on('error', (error) => {
      settled = true
      rejectWorker(error)
    })

    worker.on('exit', (code) => {
      if (!settled && code !== 0) {
        rejectWorker(new Error(`Worker exited with code ${code}`))
      }
    })
  })
}

async function mergeChunkOutputs(chunkPaths, outputPath) {
  const outputStream = createWriteStream(outputPath, { flags: 'w' })

  for (const chunkPath of chunkPaths) {
    await new Promise((resolveMerge, rejectMerge) => {
      const inputStream = createReadStream(chunkPath)
      inputStream.on('error', rejectMerge)
      inputStream.on('end', resolveMerge)
      inputStream.pipe(outputStream, { end: false })
    })
  }

  outputStream.end()
  await finished(outputStream)
}

async function processSingleThreaded(inputPath, outputPath, gzipIn) {
  const { filterOffFranceLiteLine, mightMatchOffFranceLine } = await import(
    './lib/off-france-filter.mjs'
  )

  const inputStream = gzipIn
    ? createReadStream(inputPath).pipe(createGunzip())
    : createReadStream(inputPath)

  const outputStream = createWriteStream(outputPath, { flags: 'w' })
  const lineReader = createInterface({ input: inputStream, crlfDelay: Infinity })

  const stats = {
    totalLines: 0,
    prefilterSkipped: 0,
    parsedLines: 0,
    kept: 0,
  }

  const startedAt = Date.now()

  for await (const line of lineReader) {
    stats.totalLines += 1

    if (stats.totalLines % PROGRESS_EVERY_LINES === 0) {
      const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(0)
      console.error(
        `[off-filter-fast] ${stats.totalLines.toLocaleString('fr-FR')} lines read, ${stats.kept.toLocaleString('fr-FR')} kept (${elapsedSec}s)`,
      )
    }

    if (!mightMatchOffFranceLine(line)) {
      stats.prefilterSkipped += 1
      continue
    }

    stats.parsedLines += 1
    const liteProduct = filterOffFranceLiteLine(line)
    if (!liteProduct) {
      continue
    }

    stats.kept += 1
    outputStream.write(`${JSON.stringify(liteProduct)}\n`)
  }

  outputStream.end()
  await finished(outputStream)

  return { ...stats, elapsedMs: Date.now() - startedAt, workers: 1 }
}

async function processParallel(inputPath, outputPath, workerCount) {
  const boundaries = findNewlineAlignedBoundaries(inputPath, workerCount)
  const effectiveWorkers = Math.max(1, boundaries.length - 1)
  const chunkPaths = []
  const startedAt = Date.now()

  const workerPromises = []

  for (let index = 0; index < effectiveWorkers; index += 1) {
    const start = boundaries[index]
    const end = boundaries[index + 1]
    const chunkPath = join(
      tmpdir(),
      `off-france-chunk-${process.pid}-${index}-${basename(outputPath)}`,
    )
    chunkPaths.push(chunkPath)

    workerPromises.push(
      runWorker(WORKER_URL, {
        inputPath,
        start,
        end,
        outputPath: chunkPath,
      }),
    )
  }

  const workerStats = await Promise.all(workerPromises)
  await mergeChunkOutputs(chunkPaths, outputPath)

  for (const chunkPath of chunkPaths) {
    unlinkSync(chunkPath)
  }

  const totals = workerStats.reduce(
    (acc, stats) => ({
      totalLines: acc.totalLines + stats.totalLines,
      prefilterSkipped: acc.prefilterSkipped + stats.prefilterSkipped,
      parsedLines: acc.parsedLines + stats.parsedLines,
      kept: acc.kept + stats.kept,
    }),
    { totalLines: 0, prefilterSkipped: 0, parsedLines: 0, kept: 0 },
  )

  return {
    ...totals,
    elapsedMs: Date.now() - startedAt,
    workers: effectiveWorkers,
  }
}

async function main() {
  const { inputPath, outputPath, workers, gzipIn } = resolveArgs()
  resolveExistingPath(inputPath, 'Fichier source')
  ensureOutputDirectory(outputPath)

  const stats =
    gzipIn || workers === 1
      ? await processSingleThreaded(inputPath, outputPath, gzipIn)
      : await processParallel(inputPath, outputPath, workers)

  const elapsedSec = (stats.elapsedMs / 1000).toFixed(1)
  const linesPerSec = Math.round(stats.totalLines / (stats.elapsedMs / 1000))

  console.error(
    [
      '[off-filter-fast] Done.',
      `Input: ${inputPath}`,
      `Output: ${outputPath}`,
      `Workers: ${stats.workers}`,
      `Lines read: ${stats.totalLines.toLocaleString('fr-FR')}`,
      `Prefilter skipped: ${stats.prefilterSkipped.toLocaleString('fr-FR')}`,
      `Parsed: ${stats.parsedLines.toLocaleString('fr-FR')}`,
      `Kept: ${stats.kept.toLocaleString('fr-FR')}`,
      `Throughput: ${linesPerSec.toLocaleString('fr-FR')} lines/s`,
      `Duration: ${elapsedSec}s`,
    ].join('\n'),
  )
}

main().catch((error) => {
  console.error('[off-filter-fast] Failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})

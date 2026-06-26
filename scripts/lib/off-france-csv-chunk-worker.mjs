import { createReadStream, createWriteStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { finished } from 'node:stream/promises'
import { parentPort, workerData } from 'node:worker_threads'
import { createGunzip } from 'node:zlib'

import {
  filterOffFranceCsvRow,
  mightMatchOffFranceCsvLine,
  parseTsvLine,
} from './off-france-csv.mjs'

async function processChunk() {
  const { inputPath, start, end, outputPath, columnMap, gzipIn, skipHeader } = workerData

  const inputStream = gzipIn
    ? createReadStream(inputPath).pipe(createGunzip())
    : createReadStream(inputPath, {
        start,
        end: end > start ? end - 1 : start,
      })

  const lineReader = createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  })

  const outputStream = createWriteStream(outputPath, { flags: 'w' })
  const stats = {
    totalLines: 0,
    prefilterSkipped: 0,
    parsedLines: 0,
    kept: 0,
  }

  let skipPartialFirstLine = !gzipIn && start > 0
  let skippedHeader = !skipHeader

  for await (const line of lineReader) {
    if (skipPartialFirstLine) {
      skipPartialFirstLine = false
      continue
    }

    if (!skippedHeader) {
      skippedHeader = true
      continue
    }

    stats.totalLines += 1

    if (!mightMatchOffFranceCsvLine(line)) {
      stats.prefilterSkipped += 1
      continue
    }

    stats.parsedLines += 1
    const fields = parseTsvLine(line)
    const liteProduct = filterOffFranceCsvRow(fields, columnMap)
    if (!liteProduct) {
      continue
    }

    stats.kept += 1
    outputStream.write(`${JSON.stringify(liteProduct)}\n`)
  }

  outputStream.end()
  await finished(outputStream)
  parentPort.postMessage(stats)
}

processChunk().catch((error) => {
  parentPort.postMessage({
    error: error instanceof Error ? error.message : String(error),
  })
})

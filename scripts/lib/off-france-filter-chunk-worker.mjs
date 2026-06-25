import { createReadStream, createWriteStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { finished } from 'node:stream/promises'
import { parentPort, workerData } from 'node:worker_threads'

import {
  filterOffFranceLiteLine,
  mightMatchOffFranceLine,
} from './off-france-filter.mjs'

async function processChunk() {
  const { inputPath, start, end, outputPath } = workerData
  const outputStream = createWriteStream(outputPath, { flags: 'w' })

  const inputStream = createReadStream(inputPath, {
    start,
    end: end > start ? end - 1 : start,
  })

  const lineReader = createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  })

  const stats = {
    totalLines: 0,
    prefilterSkipped: 0,
    parsedLines: 0,
    kept: 0,
  }

  let skipPartialFirstLine = start > 0
  let writeChain = Promise.resolve()

  for await (const line of lineReader) {
    if (skipPartialFirstLine) {
      skipPartialFirstLine = false
      continue
    }

    stats.totalLines += 1

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
    writeChain = writeChain.then(
      () =>
        new Promise((resolveWrite, rejectWrite) => {
          outputStream.write(`${JSON.stringify(liteProduct)}\n`, (error) => {
            if (error) {
              rejectWrite(error)
              return
            }
            resolveWrite()
          })
        }),
    )
  }

  await writeChain
  outputStream.end()
  await finished(outputStream)

  parentPort.postMessage(stats)
}

processChunk().catch((error) => {
  parentPort.postMessage({
    error: error instanceof Error ? error.message : String(error),
  })
})

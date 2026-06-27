#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) {
    return
  }

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separator = trimmed.indexOf('=')
    if (separator === -1) {
      continue
    }

    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim()
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadEnvLocal()

const { enrichExerciseContent } = await import('../functions/_exercise/enrich.ts')
const { listPublicExercises } = await import('../functions/_exercise/hasura.ts')

async function main() {
  const exercises = await listPublicExercises()
  console.log(`[ingest] ${exercises.length} public exercises`)

  let ready = 0
  let partial = 0
  let failed = 0

  for (const exercise of exercises) {
    if (exercise.content_status === 'ready' && exercise.demo_file_id) {
      ready += 1
      continue
    }

    process.stdout.write(`[ingest] ${exercise.name}… `)

    try {
      const result = await enrichExerciseContent(exercise.id)
      if (result.content_status === 'ready') {
        ready += 1
        console.log('ready')
      } else {
        partial += 1
        console.log(result.content_status)
      }
    } catch (error) {
      failed += 1
      console.log(`failed (${error instanceof Error ? error.message : error})`)
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 350))
  }

  console.log(`[ingest] done — ready: ${ready}, partial: ${partial}, failed: ${failed}`)
}

main().catch((error) => {
  console.error('[ingest] fatal:', error)
  process.exitCode = 1
})

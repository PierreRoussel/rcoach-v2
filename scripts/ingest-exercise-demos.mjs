#!/usr/bin/env node

import { loadEnvLocal, describeMissingNhostEnv } from './lib/load-env-local.mjs'

const envResult = loadEnvLocal({ force: true })
if (!envResult.loaded) {
  console.warn(`[ingest] Fichier introuvable : ${envResult.path}`)
} else if (envResult.keys.length > 0) {
  console.log(`[ingest] Variables chargées depuis .env.local : ${envResult.keys.join(', ')}`)
}

const missing = describeMissingNhostEnv()
if (missing.length > 0) {
  console.error('[ingest] Configuration Nhost manquante :')
  for (const entry of missing) {
    console.error(`  - ${entry}`)
  }
  console.error(
    '[ingest] Astuce : entourez le secret de guillemets doubles s’il contient # ou des espaces.',
  )
  console.error('  Exemple : CODEGEN_HASURA_ADMIN_SECRET="votre-secret-complet"')
  process.exitCode = 1
  process.exit(1)
}

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

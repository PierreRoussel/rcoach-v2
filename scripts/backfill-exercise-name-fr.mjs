#!/usr/bin/env node

import { parseArgs } from 'node:util'

import { loadEnvLocal, describeMissingNhostEnv } from './lib/load-env-local.mjs'

function printHelp() {
  console.log(`Remplit exercises.name_fr pour tout le catalogue (wger + règles anglicismes).

Usage:
  npm run backfill:exercise-name-fr
  npm run backfill:exercise-name-fr -- --dry-run
  npm run backfill:exercise-name-fr -- --force

Options:
  --dry-run   Simule sans écrire
  --force     Écrase un name_fr déjà renseigné (y compris null explicite)
  --help, -h  Aide
`)
}

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
})

if (values.help) {
  printHelp()
  process.exit(0)
}

loadEnvLocal({ force: true })

const missing = describeMissingNhostEnv()
if (missing.length > 0) {
  console.error('[backfill:name_fr] Configuration Nhost manquante.')
  for (const entry of missing) {
    console.error(`  - ${entry}`)
  }
  process.exit(1)
}

const { backfillExerciseNameFr } = await import('../functions/_exercise/backfill-name-fr.ts')

console.log('[backfill:name_fr] Début…')

try {
  const summary = await backfillExerciseNameFr({
    dryRun: values['dry-run'],
    force: values.force,
    onProgress: (message) => console.log(message),
  })

  console.log(
    `[backfill:name_fr] terminé — mis à jour: ${summary.updated}, inchangés: ${summary.skipped}, déjà remplis: ${summary.skippedExisting}, échecs: ${summary.failed}`,
  )
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('name_fr')) {
    console.error(
      '[backfill:name_fr] Colonne name_fr absente. Appliquez la migration puis déployez :',
    )
    console.error('  nhost up   (local)  ou  nhost deploy   (cloud)')
  }
  throw error
}

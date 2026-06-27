#!/usr/bin/env node

import { parseArgs } from 'node:util'

import { loadEnvLocal, describeMissingNhostEnv } from './lib/load-env-local.mjs'

function printHelp() {
  console.log(`Importe des exercices publics depuis wger.de dans public.exercises.

Usage:
  npm run import:wger-exercises
  npm run import:wger-exercises -- --dry-run
  npm run import:wger-exercises -- --limit 50
  npm run import:wger-exercises -- --category legs
  npm run import:wger-exercises -- --enrich

Options:
  --dry-run           Affiche les insertions sans écrire en base
  --limit, -n <n>     Nombre max de nouveaux exercices à insérer
  --category, -c      Filtrer par catégorie wger: abs, arms, back, calves, cardio, chest, legs, shoulders
  --no-link-existing  Ne pas lier les exercices du catalogue via wger-exercise-map.json
  --enrich            Enrichit chaque nouvel exercice (descriptions + démos wger)
  --help, -h          Aide
`)
}

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    limit: { type: 'string', short: 'n' },
    category: { type: 'string', short: 'c' },
    'no-link-existing': { type: 'boolean', default: false },
    enrich: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: false,
})

if (values.help) {
  printHelp()
  process.exit(0)
}

const envResult = loadEnvLocal({ force: true })
if (!envResult.loaded) {
  console.warn(`[import:wger] Fichier introuvable : ${envResult.path}`)
} else if (envResult.keys.length > 0) {
  console.log(`[import:wger] Variables chargées depuis .env.local : ${envResult.keys.join(', ')}`)
}

const missing = describeMissingNhostEnv()
if (missing.length > 0) {
  console.error('[import:wger] Configuration Nhost manquante :')
  for (const entry of missing) {
    console.error(`  - ${entry}`)
  }
  process.exit(1)
}

if (values.enrich) {
  const hasIngestToken = Boolean(process.env.NHOST_INGEST_ACCESS_TOKEN)
  const hasIngestCredentials =
    Boolean(process.env.NHOST_INGEST_EMAIL) && Boolean(process.env.NHOST_INGEST_PASSWORD)

  if (!hasIngestToken && !hasIngestCredentials) {
    console.error('[import:wger] --enrich nécessite NHOST_INGEST_EMAIL + NHOST_INGEST_PASSWORD')
    process.exit(1)
  }
}

const { importWgerExercises } = await import('../functions/_exercise/import-wger.ts')
const { WGER_CATEGORY_IDS } = await import('../functions/_exercise/wger.ts')

const category = values.category?.trim().toLowerCase()
if (category && !(category in WGER_CATEGORY_IDS)) {
  console.error(
    `[import:wger] Catégorie inconnue "${category}". Valeurs: ${Object.keys(WGER_CATEGORY_IDS).join(', ')}`,
  )
  process.exit(1)
}

let enrichHandler
if (values.enrich) {
  const { enrichExerciseContent } = await import('../functions/_exercise/enrich.ts')
  enrichHandler = async (exerciseId) => {
    await enrichExerciseContent(exerciseId)
  }
}

const limit = values.limit ? Number.parseInt(values.limit, 10) : undefined
if (values.limit && (!Number.isFinite(limit) || limit <= 0)) {
  console.error('[import:wger] --limit doit être un entier positif.')
  process.exit(1)
}

console.log('[import:wger] Récupération du catalogue wger…')

try {
  const summary = await importWgerExercises({
    dryRun: values['dry-run'],
    limit,
    category: category ?? undefined,
    linkExisting: !values['no-link-existing'],
    enrich: enrichHandler,
  })

  console.log(
    `[import:wger] terminé — liés: ${summary.linked}, liaisons ignorées: ${summary.linkSkippedWgerIdTaken}, insérés: ${summary.inserted}, déjà présents: ${summary.skippedExisting}, noms en double: ${summary.skippedDuplicateName}, échecs: ${summary.failed}`,
  )
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('wger_exercise_id')) {
    console.error(
      '[import:wger] La colonne wger_exercise_id est absente. Appliquez la migration puis déployez :',
    )
    console.error('  nhost up   (local)  ou  nhost deploy   (cloud)')
  }
  throw error
}

#!/usr/bin/env node
/**
 * Import CIQUAL aliments (XML) into public.foods.
 *
 * Usage:
 *   node scripts/import-ciqual-xml.mjs --dir E:/off
 *   node scripts/import-ciqual-xml.mjs --alim E:/off/alim_2025_11_03.xml --compo E:/off/compo_2025_11_03.xml
 *   node scripts/import-ciqual-xml.mjs --dir E:/off --dry-run
 *   node scripts/import-ciqual-xml.mjs --check
 */

import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import pg from 'pg'
import {
  formatPostgresAuthHelp,
  isSaslAuthError,
  maskPostgresConfig,
  resolvePostgresConfig,
} from './lib/postgres-config.mjs'
import { buildCiqualInsertQuery, mapCiqualFoodToRow } from './lib/ciqual-import.mjs'
import {
  CIQUAL_NUTRIENT_CODES,
  parseAlimBlock,
  parseCompoBlock,
  readXmlBlocks,
  streamXmlBlocks,
} from './lib/ciqual-xml.mjs'

const { Client } = pg
const DEFAULT_BATCH_SIZE = 200
const PROGRESS_EVERY = 500

function printHelp() {
  console.log(`Import CIQUAL (alim + compo XML) → public.foods

Options:
  --dir, -D <path>       Dossier contenant alim_*.xml et compo_*.xml (ex. E:/off)
  --alim, -a <path>      Fichier alim_*.xml
  --compo, -c <path>     Fichier compo_*.xml
  --batch, -b <n>        Taille batch insert (défaut ${DEFAULT_BATCH_SIZE})
  --upsert, -u           Mettre à jour les aliments existants (ciqual_code)
  --limit, -n <n>        Limiter le nombre d'aliments traités
  --database-url, -d     URL Postgres (sinon env N/DATABASE_URL)
  --dry-run              Parse sans écrire
  --check                Test connexion Postgres
  --help, -h             Aide
`)
}

function findLatestXml(dir, prefix) {
  const files = readdirSync(dir)
    .filter(
      (name) =>
        name.startsWith(prefix) &&
        name.endsWith('.xml') &&
        !name.startsWith(`${prefix}grp_`),
    )
    .sort()
  return files.length > 0 ? resolve(dir, files.at(-1)) : null
}

function resolveInputPaths({ dir, alim, compo }) {
  if (alim && compo) {
    return { alimPath: resolve(alim), compoPath: resolve(compo) }
  }

  if (!dir) {
    return null
  }

  const dirPath = resolve(dir)
  const alimPath = alim ? resolve(alim) : findLatestXml(dirPath, 'alim_')
  const compoPath = compo ? resolve(compo) : findLatestXml(dirPath, 'compo_')

  if (!alimPath || !compoPath) {
    throw new Error(
      `Impossible de trouver alim_*.xml et compo_*.xml dans ${dirPath}. Utilisez --alim et --compo.`,
    )
  }

  return { alimPath, compoPath }
}

async function checkConnection(databaseConfig) {
  const client = new Client(databaseConfig)
  try {
    await client.connect()
    console.log('[ciqual-import] Connexion Postgres OK')
    await assertImportReady(client)
  } finally {
    await client.end()
  }
}

async function assertImportReady(client) {
  const result = await client.query(`
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'foods_ciqual_code_unique_idx'
    LIMIT 1
  `)

  if (result.rowCount === 0) {
    throw new Error(
      'Index foods_ciqual_code_unique_idx introuvable. Déployez les migrations nhost CIQUAL (1742400000000_food_source_ciqual, 1742400000001_ciqual_foods_catalog) avant l\'import.',
    )
  }
}

async function loadAliments(alimPath) {
  const blocks = await readXmlBlocks(alimPath, 'ALIM')
  const aliments = new Map()

  for (const block of blocks) {
    const alim = parseAlimBlock(block)
    if (alim) {
      aliments.set(alim.alimCode, alim)
    }
  }

  return aliments
}

async function loadNutrients(compoPath) {
  const nutrientsByAlim = new Map()
  let compoRows = 0

  for await (const block of streamXmlBlocks(compoPath, 'COMPO')) {
    compoRows += 1
    const compo = parseCompoBlock(block)
    if (!compo) {
      continue
    }

    const code = compo.constCode
    if (!Object.values(CIQUAL_NUTRIENT_CODES).includes(code)) {
      continue
    }

    let nutrients = nutrientsByAlim.get(compo.alimCode)
    if (!nutrients) {
      nutrients = {}
      nutrientsByAlim.set(compo.alimCode, nutrients)
    }
    nutrients[code] = compo.value

    if (compoRows % 50_000 === 0) {
      console.log(
        `[ciqual-import] ${compoRows.toLocaleString('fr-FR')} lignes compo lues, ${nutrientsByAlim.size.toLocaleString('fr-FR')} aliments`,
      )
    }
  }

  console.log(
    `[ciqual-import] Compo terminé — ${compoRows.toLocaleString('fr-FR')} lignes, ${nutrientsByAlim.size.toLocaleString('fr-FR')} aliments avec nutriments`,
  )

  return nutrientsByAlim
}

async function flushBatch(client, batch, { upsert, dryRun, stats }) {
  if (batch.length === 0) {
    return
  }

  const query = buildCiqualInsertQuery(batch, { upsert })
  if (!query) {
    return
  }

  if (dryRun) {
    stats.inserted += batch.length
    batch.length = 0
    return
  }

  const result = await client.query(query.text, query.values)
  stats.inserted += result.rowCount ?? 0
  batch.length = 0
}

async function importCiqual({
  alimPath,
  compoPath,
  databaseConfig,
  batchSize,
  upsert,
  limit,
  dryRun,
}) {
  if (!existsSync(alimPath)) {
    throw new Error(`Fichier introuvable: ${alimPath}`)
  }
  if (!existsSync(compoPath)) {
    throw new Error(`Fichier introuvable: ${compoPath}`)
  }

  const stats = {
    aliments: 0,
    parsed: 0,
    skipped: 0,
    inserted: 0,
  }

  console.log(`[ciqual-import] Chargement aliments: ${alimPath}`)
  const aliments = await loadAliments(alimPath)
  stats.aliments = aliments.size
  console.log(`[ciqual-import] ${stats.aliments.toLocaleString('fr-FR')} aliments chargés`)

  console.log(`[ciqual-import] Chargement compositions: ${compoPath}`)
  const nutrientsByAlim = await loadNutrients(compoPath)

  const client = dryRun
    ? null
    : new Client({
        ...databaseConfig,
        keepAlive: true,
      })

  if (client) {
    await client.connect()
    await assertImportReady(client)
  }

  const batch = []
  let processed = 0

  try {
    for (const [alimCode, alim] of aliments) {
      if (limit != null && processed >= limit) {
        break
      }
      processed += 1

      const nutrients = nutrientsByAlim.get(alimCode)
      const row = mapCiqualFoodToRow(alim, nutrients)
      if (!row) {
        stats.skipped += 1
        continue
      }

      stats.parsed += 1
      batch.push(row)

      if (batch.length >= batchSize) {
        await flushBatch(client, batch, { upsert, dryRun, stats })
      }

      if (processed % PROGRESS_EVERY === 0) {
        console.log(
          `[ciqual-import] ${processed.toLocaleString('fr-FR')}/${stats.aliments.toLocaleString('fr-FR')} aliments, ${stats.parsed.toLocaleString('fr-FR')} valides, ${stats.skipped.toLocaleString('fr-FR')} ignorés, ${stats.inserted.toLocaleString('fr-FR')} écrits`,
        )
      }
    }

    await flushBatch(client, batch, { upsert, dryRun, stats })
  } finally {
    if (client) {
      await client.end()
    }
  }

  return stats
}

async function main() {
  const { values } = parseArgs({
    options: {
      dir: { type: 'string', short: 'D' },
      alim: { type: 'string', short: 'a' },
      compo: { type: 'string', short: 'c' },
      batch: { type: 'string', short: 'b', default: String(DEFAULT_BATCH_SIZE) },
      upsert: { type: 'boolean', short: 'u', default: false },
      limit: { type: 'string', short: 'n' },
      'database-url': { type: 'string', short: 'd' },
      check: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: false,
  })

  if (values.help) {
    printHelp()
    return
  }

  if (values.check) {
    const databaseConfig = resolvePostgresConfig({ explicitUrl: values['database-url'] })
    console.log('[ciqual-import] Test connexion:', maskPostgresConfig(databaseConfig))
    await checkConnection(databaseConfig)
    return
  }

  const paths = resolveInputPaths({
    dir: values.dir,
    alim: values.alim,
    compo: values.compo,
  })

  if (!paths) {
    printHelp()
    process.exitCode = 1
    return
  }

  const batchSize = Number(values.batch)
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 5000) {
    throw new Error('--batch doit être un entier entre 1 et 5000.')
  }

  const limit = values.limit != null ? Number(values.limit) : null
  if (limit != null && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error('--limit doit être un entier positif.')
  }

  const databaseConfig = values['dry-run']
    ? null
    : resolvePostgresConfig({ explicitUrl: values['database-url'] })

  console.log(`[ciqual-import] Alim: ${paths.alimPath}`)
  console.log(`[ciqual-import] Compo: ${paths.compoPath}`)
  if (values['dry-run']) {
    console.log('[ciqual-import] Mode dry-run (aucune écriture)')
  } else {
    console.log('[ciqual-import] Postgres:', maskPostgresConfig(databaseConfig))
    console.log(`[ciqual-import] Batch: ${batchSize}, upsert: ${values.upsert ? 'oui' : 'non'}`)
  }

  const startedAt = Date.now()
  const stats = await importCiqual({
    ...paths,
    databaseConfig,
    batchSize,
    upsert: values.upsert,
    limit,
    dryRun: values['dry-run'],
  })

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(
    `[ciqual-import] Terminé en ${elapsedSec}s — ${stats.aliments.toLocaleString('fr-FR')} aliments, ${stats.parsed.toLocaleString('fr-FR')} valides, ${stats.skipped.toLocaleString('fr-FR')} ignorés, ${stats.inserted.toLocaleString('fr-FR')} écrits`,
  )
}

main().catch((error) => {
  if (isSaslAuthError(error)) {
    console.error('[ciqual-import] SASL authentication failed')
    console.error(formatPostgresAuthHelp())
  } else {
    console.error(`[ciqual-import] Échec: ${error.message}`)
  }
  process.exitCode = 1
})

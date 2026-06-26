#!/usr/bin/env node

import { createReadStream, existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import pg from 'pg'

import {
  buildFoodInsertQuery,
  mapLiteProductToFoodRow,
} from './lib/off-france-import.mjs'
import {
  formatPostgresAuthHelp,
  isSaslAuthError,
  maskPostgresConfig,
  resolvePostgresConfig,
} from './lib/postgres-config.mjs'

const { Client } = pg
const PROGRESS_EVERY_LINES = 50_000
const DEFAULT_BATCH_SIZE = 1000

function printHelp() {
  console.log(`Usage:
  node scripts/import-off-france-jsonl.mjs --input <path> [options]

Imports OFF France lite JSONL into public.foods (source = open_food_facts).

Requires DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE
(Postgres connection from Nhost Dashboard → Settings → Database).

Options:
  --input, -i         Input .jsonl file (required unless --check)
  --check             Test Postgres connection and exit
  --batch, -b         Rows per INSERT batch (default: ${DEFAULT_BATCH_SIZE})
  --upsert, -u        Update existing rows on conflict (default: skip duplicates)
  --limit, -n         Import at most N lines (for testing)
  --database-url, -d  Postgres URL (overrides DATABASE_URL env)
  --dry-run           Parse and count rows without writing to the database
  --help, -h          Show this help

Example:
  DATABASE_URL="postgres://..." \\
    npm run import:off-france -- \\
      -i E:/off/off-france-lite-csv.jsonl
`)
}

async function checkConnection(databaseConfig) {
  const client = new Client(databaseConfig)
  try {
    await client.connect()
    console.log('[off-import] Connexion Postgres OK')

    const migration = await client.query(`
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = 'foods_off_product_id_unique_idx'
      LIMIT 1
    `)

    if (migration.rowCount === 0) {
      console.warn(
        '[off-import] Migration 1742000000000_off_foods_catalog absente — déployez nhost avant l\'import.',
      )
    }

    const count = await client.query(
      `SELECT count(*)::int AS count FROM public.foods WHERE source = 'open_food_facts'`,
    )
    console.log(
      `[off-import] ${count.rows[0]?.count ?? 0} produits OFF déjà en base.`,
    )
  } finally {
    await client.end().catch(() => {})
  }
}

async function assertImportReady(client) {
  const result = await client.query(`
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'foods_off_product_id_unique_idx'
    LIMIT 1
  `)

  if (result.rowCount === 0) {
    throw new Error(
      'Index foods_off_product_id_unique_idx introuvable. Déployez la migration nhost (1742000000000_off_foods_catalog) avant l\'import.',
    )
  }
}

async function flushBatch(client, batch, { upsert, dryRun, stats }) {
  if (batch.length === 0) {
    return
  }

  const query = buildFoodInsertQuery(batch, { upsert })
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

async function importJsonl({
  inputPath,
  databaseConfig,
  batchSize,
  upsert,
  limit,
  dryRun,
}) {
  if (!existsSync(inputPath)) {
    throw new Error(`Fichier introuvable: ${inputPath}`)
  }

  const stats = {
    lines: 0,
    parsed: 0,
    skipped: 0,
    inserted: 0,
  }

  const client = dryRun ? null : new Client(databaseConfig)

  if (client) {
    await client.connect()
    await assertImportReady(client)
    await client.query('BEGIN')
  }

  const batch = []
  const reader = createInterface({
    input: createReadStream(inputPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  try {
    for await (const line of reader) {
      if (limit != null && stats.lines >= limit) {
        break
      }

      stats.lines += 1

      const trimmed = line.trim()
      if (!trimmed) {
        continue
      }

      let lite
      try {
        lite = JSON.parse(trimmed)
      } catch {
        stats.skipped += 1
        continue
      }

      const row = mapLiteProductToFoodRow(lite)
      if (!row) {
        stats.skipped += 1
        continue
      }

      stats.parsed += 1
      batch.push(row)

      if (batch.length >= batchSize) {
        await flushBatch(client, batch, { upsert, dryRun, stats })
      }

      if (stats.lines % PROGRESS_EVERY_LINES === 0) {
        console.log(
          `[off-import] ${stats.lines.toLocaleString('fr-FR')} lignes lues, ${stats.parsed.toLocaleString('fr-FR')} valides, ${stats.inserted.toLocaleString('fr-FR')} écrites`,
        )
      }
    }

    await flushBatch(client, batch, { upsert, dryRun, stats })

    if (client) {
      await client.query('COMMIT')
    }
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK')
    }
    throw error
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
      input: { type: 'string', short: 'i' },
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
    console.log('[off-import] Test connexion:', maskPostgresConfig(databaseConfig))
    await checkConnection(databaseConfig)
    return
  }

  if (!values.input) {
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

  const inputPath = resolve(values.input)
  const databaseConfig = values['dry-run']
    ? null
    : resolvePostgresConfig({ explicitUrl: values['database-url'] })

  console.log(`[off-import] Input: ${inputPath}`)
  if (values['dry-run']) {
    console.log('[off-import] Mode dry-run (aucune écriture)')
  } else {
    console.log('[off-import] Postgres:', maskPostgresConfig(databaseConfig))
    console.log(`[off-import] Batch: ${batchSize}, upsert: ${values.upsert ? 'oui' : 'non'}`)
  }

  const startedAt = Date.now()
  const stats = await importJsonl({
    inputPath,
    databaseConfig,
    batchSize,
    upsert: values.upsert,
    limit,
    dryRun: values['dry-run'],
  })

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(
    `[off-import] Terminé en ${elapsedSec}s — ${stats.lines.toLocaleString('fr-FR')} lignes, ${stats.parsed.toLocaleString('fr-FR')} valides, ${stats.skipped.toLocaleString('fr-FR')} ignorées, ${stats.inserted.toLocaleString('fr-FR')} écrites`,
  )
}

main().catch((error) => {
  if (isSaslAuthError(error)) {
    console.error('[off-import] SASL authentication failed')
    console.error(formatPostgresAuthHelp())
  } else {
    console.error(`[off-import] Échec: ${error.message}`)
  }
  process.exitCode = 1
})

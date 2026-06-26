#!/usr/bin/env node

import { parseArgs } from 'node:util'
import pg from 'pg'

import {
  formatPostgresAuthHelp,
  isSaslAuthError,
  maskPostgresConfig,
  resolvePostgresConfig,
} from './lib/postgres-config.mjs'

const { Client } = pg

async function main() {
  const { values } = parseArgs({
    options: {
      'database-url': { type: 'string', short: 'd' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })

  if (values.help) {
    console.log(`Usage: node scripts/check-postgres-connection.mjs [--database-url <url>]`)
    return
  }

  const config = resolvePostgresConfig({ explicitUrl: values['database-url'] })
  console.log('[postgres] Connexion avec:', maskPostgresConfig(config))

  const client = new Client(config)

  try {
    await client.connect()
    const result = await client.query('SELECT current_database() AS db, current_user AS user')
    console.log('[postgres] OK — connecté en tant que', result.rows[0]?.user, 'sur', result.rows[0]?.db)
  } catch (error) {
    if (isSaslAuthError(error)) {
      console.error('[postgres] SASL authentication failed')
      console.error(formatPostgresAuthHelp())
    } else {
      console.error(`[postgres] Échec: ${error.message}`)
    }
    process.exitCode = 1
  } finally {
    await client.end().catch(() => {})
  }
}

main()

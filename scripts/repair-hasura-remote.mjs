#!/usr/bin/env node
/**
 * Repairs remote Hasura when metadata is inconsistent or scalar functions are not trackable.
 * Requires .env.local: PGPASSWORD, PGHOST, PGDATABASE, CODEGEN_HASURA_ADMIN_SECRET (no extra quotes).
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

function parseEnvValue(raw) {
  let value = raw.trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }
  return value
}

function loadEnv() {
  const env = {}
  const envPath = resolve(process.cwd(), '.env.local')
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator === -1) continue
    env[trimmed.slice(0, separator).trim()] = parseEnvValue(
      trimmed.slice(separator + 1),
    )
  }
  return env
}

async function hasuraMetadata(type, args, env) {
  const response = await fetch(
    `https://${env.VITE_NHOST_SUBDOMAIN}.hasura.${env.VITE_NHOST_REGION}.nhost.run/v1/metadata`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': env.CODEGEN_HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({ type, args }),
    },
  )
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`${type} failed (${response.status}): ${text}`)
  }
  return JSON.parse(text)
}

async function main() {
  const env = loadEnv()
  const migrationSql = readFileSync(
    resolve(
      process.cwd(),
      'nhost/migrations/default/1744400000000_hasura_trackable_functions/up.sql',
    ),
    'utf8',
  )

  const client = new pg.Client({
    host: env.PGHOST,
    port: Number(env.PGPORT || 5432),
    user: env.PGUSER || 'postgres',
    password: env.PGPASSWORD,
    database: env.PGDATABASE,
    ssl: { rejectUnauthorized: false },
  })

  console.log('Applying migration 1744400000000_hasura_trackable_functions...')
  await client.connect()
  await client.query(migrationSql)
  await client.end()
  console.log('Migration applied.')

  for (const table of [
    'graphql_jsonb_result',
    'graphql_timestamptz_result',
    'graphql_uuid_result',
  ]) {
    try {
      await hasuraMetadata(
        'pg_track_table',
        { source: 'default', table: { schema: 'public', name: table } },
        env,
      )
      console.log(`Tracked table ${table}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes('already tracked')) {
        throw error
      }
      console.log(`Table ${table} already tracked`)
    }

    try {
      await hasuraMetadata(
        'pg_create_select_permission',
        {
          source: 'default',
          table: { schema: 'public', name: table },
          role: 'user',
          permission: { columns: ['value'], filter: {} },
        },
        env,
      )
      console.log(`Select permission on ${table} (user)`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes('already exists')) {
        throw error
      }
    }
  }

  const functions = [
    { name: 'ensure_user_profile', exposed_as: 'mutation' },
    { name: 'complete_my_onboarding', exposed_as: 'mutation' },
    { name: 'record_legal_consent', exposed_as: 'mutation' },
    { name: 'delete_my_account', exposed_as: 'mutation' },
    { name: 'admin_platform_metrics', exposed_as: 'query' },
    { name: 'admin_platform_recent_lists', exposed_as: 'query' },
  ]

  for (const fn of functions) {
    try {
      await hasuraMetadata(
        'pg_track_function',
        {
          source: 'default',
          function: { schema: 'public', name: fn.name },
          configuration: { exposed_as: fn.exposed_as },
        },
        env,
      )
      console.log(`Tracked function ${fn.name}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes('already tracked') && !message.includes('already exists')) {
        throw error
      }
      console.log(`Function ${fn.name} already tracked`)
    }

    try {
      await hasuraMetadata(
        'pg_create_function_permission',
        {
          function: { schema: 'public', name: fn.name },
          role: 'user',
          permission: {},
        },
        env,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes('already exists')) {
        throw error
      }
    }
  }

  const inconsistent = await hasuraMetadata('get_inconsistent_metadata', {}, env)
  if (inconsistent.inconsistent_objects?.length) {
    console.log('Dropping inconsistent metadata...')
    await hasuraMetadata('drop_inconsistent_metadata', {}, env)
  }

  await hasuraMetadata('reload_metadata', { reload_remote_schemas: true }, env)

  const health = await fetch(
    `https://${env.VITE_NHOST_SUBDOMAIN}.hasura.${env.VITE_NHOST_REGION}.nhost.run/healthz`,
  )
  console.log('Hasura health:', await health.text())
  console.log('Done. Run npm run verify:graphql')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

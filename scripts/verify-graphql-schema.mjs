#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

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
    let value = trimmed.slice(separator + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

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

loadEnvLocal()

const subdomain = process.env.VITE_NHOST_SUBDOMAIN ?? 'knnxqdyuwqvdrupkbvgr'
const region = process.env.VITE_NHOST_REGION ?? 'eu-central-1'
const endpoint = `https://${subdomain}.graphql.${region}.nhost.run/v1`
const hasuraEndpoint = `https://${subdomain}.hasura.${region}.nhost.run`
const adminSecret = process.env.CODEGEN_HASURA_ADMIN_SECRET

const REQUIRED_QUERY_FIELDS = [
  'profiles',
  'exercises',
  'workouts',
  'workout_templates',
  'scheduled_sessions',
  'friendships',
  'friend_motivations',
]

const REQUIRED_FUNCTION_FIELDS = ['admin_platform_metrics']

const REQUIRED_MUTATION_FIELDS = [
  'insert_workouts_one',
  'insert_workout_templates_one',
  'insert_scheduled_sessions_one',
  'insert_friendships_one',
  'insert_friend_motivations_one',
  'ensure_user_profile',
  'complete_my_onboarding',
]

async function introspect(headers = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      query: `{
        queryType: __type(name: "query_root") {
          fields { name }
        }
        mutationType: __type(name: "mutation_root") {
          fields { name }
        }
      }`,
    }),
  })

  const payload = await response.json()
  const queryFields =
    payload.data?.queryType?.fields?.map((field) => field.name) ?? []
  const mutationFields =
    payload.data?.mutationType?.fields?.map((field) => field.name) ?? []

  return { queryFields, mutationFields, payload }
}

async function checkHasuraHealth() {
  const response = await fetch(`${hasuraEndpoint}/healthz`)
  const text = await response.text()
  return text.trim()
}

async function getInconsistentMetadata() {
  if (!adminSecret) {
    return null
  }

  const response = await fetch(`${hasuraEndpoint}/v1/metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': adminSecret,
    },
    body: JSON.stringify({
      type: 'get_inconsistent_metadata',
      args: {},
    }),
  })

  const payload = await response.json()
  return payload.inconsistent_objects ?? []
}

async function main() {
  const health = await checkHasuraHealth()
  if (health !== 'OK') {
    console.error(`FAIL: Hasura health check: ${health}`)
    console.error(
      'Metadata is inconsistent. Run: node scripts/repair-hasura-remote.mjs (after deploy) or fix nhost/metadata then redeploy.',
    )
    process.exit(1)
  }

  if (!adminSecret) {
    console.error(
      'FAIL: CODEGEN_HASURA_ADMIN_SECRET is required (strip surrounding quotes in .env.local if present).',
    )
    process.exit(1)
  }

  const inconsistent = await getInconsistentMetadata()
  if (inconsistent.length > 0) {
    console.error('FAIL: Hasura inconsistent metadata objects:')
    for (const object of inconsistent.slice(0, 8)) {
      console.error(`- ${object.name}: ${object.reason}`)
    }
    if (inconsistent.length > 8) {
      console.error(`... and ${inconsistent.length - 8} more`)
    }
    console.error('Fix nhost/metadata and redeploy, or run node scripts/repair-hasura-remote.mjs')
    process.exit(1)
  }

  const { queryFields, mutationFields } = await introspect({
    'x-hasura-admin-secret': adminSecret,
    'x-hasura-role': 'user',
  })

  if (queryFields.includes('no_queries_available')) {
    console.error('FAIL: Hasura metadata not applied (no_queries_available).')
    process.exit(1)
  }

  const missingQueries = REQUIRED_QUERY_FIELDS.filter(
    (field) => !queryFields.includes(field),
  )

  if (missingQueries.length > 0) {
    console.error(`FAIL: Missing GraphQL query fields for role user: ${missingQueries.join(', ')}`)
    console.error(
      'Tables may exist in Postgres but are not exposed to the user role. Check nhost/metadata permissions and redeploy.',
    )
    process.exit(1)
  }

  const missingFunctions = REQUIRED_FUNCTION_FIELDS.filter(
    (field) => !queryFields.includes(field),
  )

  if (missingFunctions.length > 0) {
    console.error(
      `FAIL: Missing tracked SQL functions for role user: ${missingFunctions.join(', ')}`,
    )
    console.error(
      'Apply migration 1744400000000_hasura_trackable_functions and redeploy nhost/metadata.',
    )
    process.exit(1)
  }

  const missingMutations = REQUIRED_MUTATION_FIELDS.filter(
    (field) => !mutationFields.includes(field),
  )

  if (missingMutations.length > 0) {
    console.error(`FAIL: Missing GraphQL mutations for role user: ${missingMutations.join(', ')}`)
    process.exit(1)
  }

  console.log('OK: GraphQL schema exposes required RCoach fields (role: user).')
  console.log(`Endpoint: ${endpoint}`)
}

import { pathToFileURL } from 'node:url'

const isMainModule =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href

if (isMainModule) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}

export { parseEnvValue }

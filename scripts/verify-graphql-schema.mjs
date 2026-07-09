#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs'
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

const subdomain = process.env.VITE_NHOST_SUBDOMAIN ?? 'knnxqdyuwqvdrupkbvgr'
const region = process.env.VITE_NHOST_REGION ?? 'eu-central-1'
const endpoint = `https://${subdomain}.graphql.${region}.nhost.run/v1`
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

const REQUIRED_FUNCTION_FIELDS = [
  'ensure_user_profile',
  'complete_my_onboarding',
]

const REQUIRED_MUTATION_FIELDS = [
  'insert_workouts_one',
  'insert_workout_templates_one',
  'insert_scheduled_sessions_one',
  'insert_friendships_one',
  'insert_friend_motivations_one',
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

async function main() {
  const { queryFields, mutationFields } = await introspect()

  if (queryFields.includes('no_queries_available')) {
    console.error('FAIL: Hasura metadata not applied (no_queries_available).')
    console.error('Push nhost/metadata and redeploy via Nhost dashboard or GitHub Action.')
    process.exit(1)
  }

  const missingQueries = REQUIRED_QUERY_FIELDS.filter(
    (field) => !queryFields.includes(field),
  )

  if (missingQueries.length > 0) {
    console.error(`FAIL: Missing GraphQL query fields: ${missingQueries.join(', ')}`)
    process.exit(1)
  }

  let queryFieldsToCheck = queryFields

  if (adminSecret) {
    const admin = await introspect({
      'x-hasura-admin-secret': adminSecret,
    })
    queryFieldsToCheck = admin.queryFields
  }

  const missingFunctions = REQUIRED_FUNCTION_FIELDS.filter(
    (field) => !queryFieldsToCheck.includes(field),
  )

  if (missingFunctions.length > 0) {
    if (!adminSecret) {
      console.warn(
        `WARN: Could not verify SQL functions without CODEGEN_HASURA_ADMIN_SECRET: ${missingFunctions.join(', ')}`,
      )
    } else {
      console.error(
        `FAIL: Missing tracked SQL functions in Hasura metadata: ${missingFunctions.join(', ')}`,
      )
      console.error('Push nhost/metadata and redeploy (GitHub Action Deploy Nhost or nhost deploy).')
      process.exit(1)
    }
  }

  let mutationFieldsToCheck = mutationFields

  if (mutationFieldsToCheck.length === 0 && adminSecret) {
    const admin = await introspect({
      'x-hasura-admin-secret': adminSecret,
    })
    mutationFieldsToCheck = admin.mutationFields
  }

  const missingMutations = REQUIRED_MUTATION_FIELDS.filter(
    (field) => !mutationFieldsToCheck.includes(field),
  )

  if (missingMutations.length > 0) {
    if (!adminSecret) {
      console.warn(
        `WARN: Could not verify mutations without CODEGEN_HASURA_ADMIN_SECRET: ${missingMutations.join(', ')}`,
      )
    } else {
      console.error(`FAIL: Missing GraphQL mutations: ${missingMutations.join(', ')}`)
      process.exit(1)
    }
  }

  console.log('OK: GraphQL schema exposes required RCoach fields.')
  console.log(`Endpoint: ${endpoint}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

#!/usr/bin/env node

const subdomain = process.env.VITE_NHOST_SUBDOMAIN ?? 'knnxqdyuwqvdrupkbvgr'
const region = process.env.VITE_NHOST_REGION ?? 'eu-central-1'
const endpoint = `https://${subdomain}.graphql.${region}.nhost.run/v1`

const REQUIRED_ROOT_FIELDS = [
  'profiles',
  'exercises',
  'workouts',
  'workout_templates',
  'scheduled_sessions',
  'insert_workouts_one',
  'insert_workout_templates_one',
]

async function main() {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

  if (queryFields.includes('no_queries_available')) {
    console.error('FAIL: Hasura metadata not applied (no_queries_available).')
    console.error('Push nhost/metadata and redeploy via Nhost dashboard or GitHub Action.')
    process.exit(1)
  }

  const missing = REQUIRED_ROOT_FIELDS.filter(
    (field) =>
      !queryFields.includes(field) && !mutationFields.includes(field),
  )

  if (missing.length > 0) {
    console.error(`FAIL: Missing GraphQL fields: ${missing.join(', ')}`)
    process.exit(1)
  }

  console.log('OK: GraphQL schema exposes required RCoach fields.')
  console.log(`Endpoint: ${endpoint}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

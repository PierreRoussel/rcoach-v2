type GraphqlResponse<T> = {
  data?: T
  errors?: Array<{ message: string }>
}

export function resolveNhostEndpoints() {
  const subdomain = process.env.NHOST_SUBDOMAIN ?? process.env.VITE_NHOST_SUBDOMAIN
  const region = process.env.NHOST_REGION ?? process.env.VITE_NHOST_REGION ?? 'eu-central-1'
  const adminSecret =
    process.env.NHOST_ADMIN_SECRET ?? process.env.CODEGEN_HASURA_ADMIN_SECRET

  if (!subdomain || !adminSecret) {
    throw new Error('Missing Nhost subdomain or admin secret.')
  }

  return {
    graphqlUrl: `https://${subdomain}.graphql.${region}.nhost.run/v1`,
    storageUrl: `https://${subdomain}.storage.${region}.nhost.run/v1`,
    adminSecret,
  }
}

export async function graphqlAdminRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { graphqlUrl, adminSecret } = resolveNhostEndpoints()

  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': adminSecret,
    },
    body: JSON.stringify({ query, variables }),
  })

  const payload = (await response.json()) as GraphqlResponse<T>
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((entry) => entry.message).join(', '))
  }

  if (!payload.data) {
    throw new Error('Empty GraphQL response.')
  }

  return payload.data
}

export async function graphqlUserRequest<T>(
  query: string,
  accessToken: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { graphqlUrl } = resolveNhostEndpoints()

  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  const payload = (await response.json()) as GraphqlResponse<T>
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((entry) => entry.message).join(', '))
  }

  if (!payload.data) {
    throw new Error('Empty GraphQL response.')
  }

  return payload.data
}

export type ExerciseRow = {
  id: string
  name: string
  muscle_group: string | null
  equipment: string | null
  tracking_mode: string | null
  is_public: boolean
  created_by: string | null
  demo_file_id: string | null
  demo_poster_file_id: string | null
  description_fr: string | null
  description_en: string | null
  coaching_cues: unknown
  content_status: string
  content_source: string | null
}

export async function getExerciseById(exerciseId: string): Promise<ExerciseRow | null> {
  const data = await graphqlAdminRequest<{ exercises_by_pk: ExerciseRow | null }>(
    `query GetExercise($id: uuid!) {
      exercises_by_pk(id: $id) {
        id
        name
        muscle_group
        equipment
        tracking_mode
        is_public
        created_by
        demo_file_id
        demo_poster_file_id
        description_fr
        description_en
        coaching_cues
        content_status
        content_source
      }
    }`,
    { id: exerciseId },
  )

  return data.exercises_by_pk
}

export async function findPublicCatalogMatch(name: string): Promise<ExerciseRow | null> {
  const data = await graphqlAdminRequest<{ exercises: ExerciseRow[] }>(
    `query FindPublicExercise($name: String!) {
      exercises(
        where: {
          is_public: { _eq: true }
          name: { _eq: $name }
        }
        limit: 1
      ) {
        id
        name
        muscle_group
        equipment
        tracking_mode
        is_public
        created_by
        demo_file_id
        demo_poster_file_id
        description_fr
        description_en
        coaching_cues
        content_status
        content_source
      }
    }`,
    { name },
  )

  return data.exercises[0] ?? null
}

export async function updateExerciseContent(
  exerciseId: string,
  patch: {
    description_fr?: string | null
    description_en?: string | null
    coaching_cues?: unknown
    demo_file_id?: string | null
    demo_poster_file_id?: string | null
    content_status: string
    content_source?: string | null
  },
): Promise<void> {
  await graphqlAdminRequest(
    `mutation UpdateExerciseContent($id: uuid!, $patch: exercises_set_input!) {
      update_exercises_by_pk(pk_columns: { id: $id }, _set: $patch) {
        id
      }
    }`,
    { id: exerciseId, patch },
  )
}

export async function listPublicExercises(): Promise<ExerciseRow[]> {
  const data = await graphqlAdminRequest<{ exercises: ExerciseRow[] }>(
    `query ListPublicExercises {
      exercises(where: { is_public: { _eq: true } }, order_by: { name: asc }) {
        id
        name
        muscle_group
        equipment
        tracking_mode
        is_public
        created_by
        demo_file_id
        demo_poster_file_id
        description_fr
        description_en
        coaching_cues
        content_status
        content_source
      }
    }`,
  )

  return data.exercises
}

type GraphqlResponse<T> = {
  data?: T
  errors?: Array<{ message: string }>
}

export function resolveNhostEndpoints() {
  const subdomain = process.env.NHOST_SUBDOMAIN ?? process.env.VITE_NHOST_SUBDOMAIN
  const region = process.env.NHOST_REGION ?? process.env.VITE_NHOST_REGION ?? 'eu-central-1'
  const adminSecret =
    process.env.NHOST_ADMIN_SECRET ?? process.env.CODEGEN_HASURA_ADMIN_SECRET

  if (!subdomain?.trim() || !adminSecret?.trim()) {
    const missing = [
      !subdomain?.trim() && 'VITE_NHOST_SUBDOMAIN',
      !adminSecret?.trim() && 'CODEGEN_HASURA_ADMIN_SECRET',
    ].filter(Boolean)
    throw new Error(
      `Missing Nhost config (${missing.join(', ')}). Check .env.local at project root.`,
    )
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
  name_fr: string | null
  muscle_group: string | null
  equipment: string | null
  tracking_mode: string | null
  is_public: boolean
  created_by: string | null
  wger_exercise_id: number | null
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
        name_fr
        muscle_group
        equipment
        tracking_mode
        is_public
        created_by
        wger_exercise_id
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
        name_fr
        muscle_group
        equipment
        tracking_mode
        is_public
        created_by
        wger_exercise_id
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
    name_fr?: string | null
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
        name_fr
        muscle_group
        equipment
        tracking_mode
        is_public
        created_by
        wger_exercise_id
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

export type ExerciseCatalogEntry = {
  id: string
  name: string
  wger_exercise_id: number | null
}

export async function listExerciseCatalog(): Promise<ExerciseCatalogEntry[]> {
  const data = await graphqlAdminRequest<{ exercises: ExerciseCatalogEntry[] }>(
    `query ListExerciseCatalog {
      exercises(where: { is_public: { _eq: true } }, order_by: { name: asc }) {
        id
        name
        wger_exercise_id
      }
    }`,
  )

  return data.exercises
}

export async function insertPublicExercise(input: {
  name: string
  name_fr?: string | null
  muscle_group: string
  equipment: string
  tracking_mode: string
  wger_exercise_id: number
  description_fr?: string | null
  description_en?: string | null
  coaching_cues?: unknown
  content_status?: string
  content_source?: string | null
}): Promise<string> {
  const data = await graphqlAdminRequest<{ insert_exercises_one: { id: string } | null }>(
    `mutation InsertPublicExercise($object: exercises_insert_input!) {
      insert_exercises_one(object: $object) {
        id
      }
    }`,
    {
      object: {
        name: input.name,
        name_fr: input.name_fr ?? null,
        muscle_group: input.muscle_group,
        equipment: input.equipment,
        tracking_mode: input.tracking_mode,
        is_public: true,
        wger_exercise_id: input.wger_exercise_id,
        description_fr: input.description_fr ?? null,
        description_en: input.description_en ?? null,
        coaching_cues: input.coaching_cues ?? null,
        content_status: input.content_status ?? 'pending',
        content_source: input.content_source ?? 'wger',
      },
    },
  )

  const id = data.insert_exercises_one?.id
  if (!id) {
    throw new Error(`Failed to insert exercise "${input.name}".`)
  }

  return id
}

export async function updateExerciseWgerId(
  exerciseId: string,
  wgerExerciseId: number,
): Promise<void> {
  await graphqlAdminRequest(
    `mutation LinkExerciseWgerId($id: uuid!, $wgerExerciseId: Int!) {
      update_exercises_by_pk(
        pk_columns: { id: $id }
        _set: { wger_exercise_id: $wgerExerciseId }
      ) {
        id
      }
    }`,
    { id: exerciseId, wgerExerciseId },
  )
}

export type ExerciseNameFrRow = {
  id: string
  name: string
  name_fr: string | null
  wger_exercise_id: number | null
}

export async function listExercisesForNameFrBackfill(): Promise<ExerciseNameFrRow[]> {
  const data = await graphqlAdminRequest<{ exercises: ExerciseNameFrRow[] }>(
    `query ListExercisesForNameFrBackfill {
      exercises(order_by: { name: asc }) {
        id
        name
        name_fr
        wger_exercise_id
      }
    }`,
  )

  return data.exercises
}

export async function updateExerciseNameFr(
  exerciseId: string,
  nameFr: string | null,
): Promise<void> {
  await graphqlAdminRequest(
    `mutation UpdateExerciseNameFr($id: uuid!, $nameFr: String) {
      update_exercises_by_pk(pk_columns: { id: $id }, _set: { name_fr: $nameFr }) {
        id
      }
    }`,
    { id: exerciseId, nameFr },
  )
}

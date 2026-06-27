import { enrichExerciseContent } from './_exercise/enrich'
import { graphqlUserRequest } from './_exercise/hasura'

type FunctionRequest = {
  method: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}

type FunctionResponse = {
  status: (code: number) => FunctionResponse
  json: (body: unknown) => void
}

function readBearerToken(headers: FunctionRequest['headers']): string | null {
  const raw = headers.authorization ?? headers.Authorization
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value?.startsWith('Bearer ')) {
    return null
  }

  return value.slice('Bearer '.length).trim()
}

function readExerciseId(body: unknown): string | null {
  const payload =
    typeof body === 'string'
      ? (() => {
          try {
            return JSON.parse(body) as unknown
          } catch {
            return null
          }
        })()
      : body

  if (!payload || typeof payload !== 'object') {
    return null
  }

  const exerciseId = (payload as { exerciseId?: unknown }).exerciseId
  return typeof exerciseId === 'string' && exerciseId.trim() ? exerciseId.trim() : null
}

export default async (req: FunctionRequest, res: FunctionResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const accessToken = readBearerToken(req.headers)
  if (!accessToken) {
    res.status(401).json({ error: 'Missing bearer token.' })
    return
  }

  const exerciseId = readExerciseId(req.body)
  if (!exerciseId) {
    res.status(400).json({ error: 'Missing exerciseId.' })
    return
  }

  try {
    const owned = await graphqlUserRequest<{
      exercises_by_pk: { id: string; created_by: string | null; is_public: boolean } | null
    }>(
      `query VerifyExerciseOwner($id: uuid!) {
        exercises_by_pk(id: $id) {
          id
          created_by
          is_public
        }
      }`,
      accessToken,
      { id: exerciseId },
    )

    const exercise = owned.exercises_by_pk
    if (!exercise) {
      res.status(404).json({ error: 'Exercise not found.' })
      return
    }

    const result = await enrichExerciseContent(exerciseId)
    res.status(200).json({ ok: true, exerciseId, ...result })
  } catch (error) {
    try {
      const { updateExerciseContent } = await import('./_exercise/hasura')
      await updateExerciseContent(exerciseId, { content_status: 'failed' })
    } catch {
      // Best effort status update.
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Enrichment failed.',
    })
  }
}

import {
  readBearerToken,
  readJsonBody,
  readUserIdFromAccessToken,
} from '../_billing/auth.ts'
import { graphqlAdminRequest, graphqlUserRequest } from '../_exercise/hasura.ts'

type FunctionRequest = {
  method: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}

type FunctionResponse = {
  status: (code: number) => FunctionResponse
  json: (body: unknown) => void
}

type AdminKpiAction =
  | {
      action: 'metrics'
      from: string
      to: string
      cohortWeeks: number
    }
  | {
      action: 'recent_lists'
      limit?: number
    }
  | {
      action: 'support_requests'
      limit?: number
    }

class AdminKpiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'AdminKpiError'
  }
}

async function assertProfileIsAdmin(accessToken: string): Promise<void> {
  const userId = await readUserIdFromAccessToken(accessToken)
  if (!userId) {
    throw new AdminKpiError(401, 'Session invalide.')
  }

  const data = await graphqlUserRequest<{
    profiles_by_pk: { role: string } | null
  }>(
    `query AdminKpiProfile($id: uuid!) {
      profiles_by_pk(id: $id) {
        role
      }
    }`,
    accessToken,
    { id: userId },
  )

  if (data.profiles_by_pk?.role !== 'admin') {
    throw new AdminKpiError(403, 'Accès admin requis (profiles.role = admin).')
  }
}

function parseAction(body: unknown): AdminKpiAction {
  const payload = readJsonBody<Record<string, unknown>>(body)
  if (!payload || typeof payload.action !== 'string') {
    throw new AdminKpiError(400, 'Corps de requête invalide.')
  }

  switch (payload.action) {
    case 'metrics': {
      const from = typeof payload.from === 'string' ? payload.from : null
      const to = typeof payload.to === 'string' ? payload.to : null
      const cohortWeeks =
        typeof payload.cohortWeeks === 'number' ? payload.cohortWeeks : null

      if (!from || !to || cohortWeeks == null) {
        throw new AdminKpiError(400, 'Paramètres metrics manquants.')
      }

      return { action: 'metrics', from, to, cohortWeeks }
    }
    case 'recent_lists':
      return {
        action: 'recent_lists',
        limit: typeof payload.limit === 'number' ? payload.limit : 25,
      }
    case 'support_requests':
      return {
        action: 'support_requests',
        limit: typeof payload.limit === 'number' ? payload.limit : 50,
      }
    default:
      throw new AdminKpiError(400, 'Action admin inconnue.')
  }
}

async function handleAction(action: AdminKpiAction): Promise<unknown> {
  switch (action.action) {
    case 'metrics': {
      const data = await graphqlAdminRequest<{
        admin_platform_metrics: { value: unknown }
      }>(
        `query AdminPlatformMetrics($from: date!, $to: date!, $cohortWeeks: Int!) {
          admin_platform_metrics(
            args: { p_from: $from, p_to: $to, p_cohort_weeks: $cohortWeeks }
          ) {
            value
          }
        }`,
        {
          from: action.from,
          to: action.to,
          cohortWeeks: action.cohortWeeks,
        },
      )

      return data.admin_platform_metrics.value
    }
    case 'recent_lists': {
      const data = await graphqlAdminRequest<{
        admin_platform_recent_lists: { value: unknown }
      }>(
        `query AdminPlatformRecentLists($limit: Int!) {
          admin_platform_recent_lists(args: { p_limit: $limit }) {
            value
          }
        }`,
        { limit: action.limit ?? 25 },
      )

      return data.admin_platform_recent_lists.value
    }
    case 'support_requests': {
      const data = await graphqlAdminRequest<{
        admin_support_requests: { value: unknown }
      }>(
        `query AdminSupportRequests($limit: Int!) {
          admin_support_requests(args: { p_limit: $limit }) {
            value
          }
        }`,
        { limit: action.limit ?? 50 },
      )

      return data.admin_support_requests.value
    }
  }
}

export default async function adminKpi(req: FunctionRequest, res: FunctionResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const accessToken = readBearerToken(req.headers)
  if (!accessToken) {
    res.status(401).json({ error: 'Non authentifié.' })
    return
  }

  try {
    await assertProfileIsAdmin(accessToken)
    const action = parseAction(req.body)
    const value = await handleAction(action)
    res.status(200).json({ value })
  } catch (error) {
    if (error instanceof AdminKpiError) {
      res.status(error.statusCode).json({ error: error.message })
      return
    }

    const message = error instanceof Error ? error.message : 'Erreur admin KPI.'
    res.status(500).json({ error: message })
  }
}

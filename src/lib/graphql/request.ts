import type { NhostClient } from '@nhost/nhost-js'
import { FetchError } from '@nhost/nhost-js/fetch'

type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message: string }>
}

function formatGraphqlErrors(errors: Array<{ message: string }> | undefined) {
  if (!errors?.length) {
    return null
  }

  return errors.map((entry) => entry.message).join(', ')
}

function isHasuraRoleHeaderError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('x-hasura-role') ||
    message.includes('hasura role') ||
    message.includes('not a valid role') ||
    message.includes('role not found')
  )
}

export async function graphqlRequest<T>(
  nhost: NhostClient,
  query: string,
  variables?: Record<string, unknown>,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await nhost.graphql.request<GraphQLResponse<T>>(
      {
        query,
        variables,
      },
      options,
    )

    const formattedErrors = formatGraphqlErrors(response.body.errors)
    if (formattedErrors) {
      throw new Error(formattedErrors)
    }

    if (response.body.data == null) {
      throw new Error('Réponse GraphQL vide.')
    }

    return response.body.data
  } catch (error) {
    if (error instanceof FetchError) {
      const body = error.body as GraphQLResponse<unknown>
      throw new Error(formatGraphqlErrors(body.errors) ?? error.message)
    }

    throw error
  }
}

/** GraphQL avec rôle Hasura explicite ; retombe sur le rôle JWT par défaut si non autorisé. */
export async function graphqlRequestWithHasuraRole<T>(
  nhost: NhostClient,
  query: string,
  variables: Record<string, unknown> | undefined,
  role: string,
): Promise<T> {
  try {
    return await graphqlRequest<T>(nhost, query, variables, {
      headers: { 'x-hasura-role': role },
    })
  } catch (error) {
    if (!isHasuraRoleHeaderError(error)) {
      throw error
    }

    return graphqlRequest<T>(nhost, query, variables)
  }
}

export async function graphqlAdminKpiRequest<T>(
  nhost: NhostClient,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  return graphqlRequestWithHasuraRole<T>(nhost, query, variables, 'admin')
}

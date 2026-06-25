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

export async function graphqlRequest<T>(
  nhost: NhostClient,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  try {
    const response = await nhost.graphql.request<GraphQLResponse<T>>({
      query,
      variables,
    })

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

import type { NhostClient } from '@nhost/nhost-js'
import { FetchError } from '@nhost/nhost-js/fetch'

type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message: string }>
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

    return response.body.data as T
  } catch (error) {
    if (error instanceof FetchError) {
      const body = error.body as GraphQLResponse<unknown>
      throw new Error(body.errors?.[0]?.message ?? error.message)
    }

    throw error
  }
}

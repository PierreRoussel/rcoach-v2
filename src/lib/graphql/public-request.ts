type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message: string }>
}

function getGraphqlEndpoint() {
  const subdomain = import.meta.env.VITE_NHOST_SUBDOMAIN
  const region = import.meta.env.VITE_NHOST_REGION

  if (!subdomain || !region) {
    throw new Error('Configuration Nhost manquante.')
  }

  return `https://${subdomain}.graphql.${region}.nhost.run/v1`
}

export async function publicGraphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(getGraphqlEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  const payload = (await response.json()) as GraphQLResponse<T>

  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? 'Erreur GraphQL.')
  }

  if (!payload.data) {
    throw new Error('Réponse GraphQL vide.')
  }

  return payload.data
}

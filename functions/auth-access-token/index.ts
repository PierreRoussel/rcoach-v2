import { graphqlAdminRequest } from '../_exercise/hasura.ts'

type AuthAccessTokenRequest = {
  body?: {
    session?: {
      user?: {
        id?: string
      }
    }
  }
}

type AuthAccessTokenResponse = {
  status: (code: number) => AuthAccessTokenResponse
  json: (body: unknown) => void
}

export default async function authAccessToken(
  req: AuthAccessTokenRequest,
  res: AuthAccessTokenResponse,
) {
  const userId = req.body?.session?.user?.id

  if (!userId) {
    res.status(200).json({ claims: {} })
    return
  }

  try {
    const data = await graphqlAdminRequest<{
      profiles_by_pk: { role: string } | null
    }>(
      `query AuthAccessTokenProfile($id: uuid!) {
        profiles_by_pk(id: $id) {
          role
        }
      }`,
      { id: userId },
    )

    if (data.profiles_by_pk?.role === 'admin') {
      res.status(200).json({
        claims: {
          'https://hasura.io/jwt/claims': {
            'x-hasura-allowed-roles': ['user', 'admin'],
            'x-hasura-default-role': 'admin',
          },
        },
      })
      return
    }
  } catch {
    res.status(200).json({ claims: {} })
    return
  }

  res.status(200).json({ claims: {} })
}

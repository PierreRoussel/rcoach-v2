import type { NhostClient } from '@nhost/nhost-js'

import { DELETE_MY_ACCOUNT } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'

export async function deleteMyAccount(nhost: NhostClient) {
  const data = await graphqlRequest<{ delete_my_account: string }>(nhost, DELETE_MY_ACCOUNT)
  return data.delete_my_account
}

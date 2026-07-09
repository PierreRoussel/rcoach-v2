import type { NhostClient } from '@nhost/nhost-js'

import {
  COMPLETE_MY_ONBOARDING,
  INSERT_WEIGHT_ENTRY,
  UPDATE_MY_PROFILE,
  UPSERT_USER_MEASUREMENTS,
  type UserMeasurementsInput,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  isGraphqlMissingFieldError,
  ONBOARDING_NOT_DEPLOYED_MESSAGE,
} from '@/lib/graphql/schema-errors'
import { queryClient } from '@/lib/query-client'
import { profileQueryKey } from '@/lib/auth/guard-profile'

import { ensureUserProfile } from './ensure-user-profile'
import {
  buildUserMeasurementsUpsertFromOnboarding,
  hasOnboardingBodyData,
  parseOnboardingWeightKg,
  type ProfileOnboardingFormData,
} from './profile-form'

async function completeMyOnboardingViaRpc(nhost: NhostClient) {
  try {
    const data = await graphqlRequest<{ complete_my_onboarding: string }>(
      nhost,
      COMPLETE_MY_ONBOARDING,
    )
    return data.complete_my_onboarding
  } catch (error) {
    if (isGraphqlMissingFieldError(error, 'complete_my_onboarding')) {
      return null
    }

    throw error
  }
}

async function completeMyOnboardingViaUpdate(
  nhost: NhostClient,
  profileId: string,
) {
  try {
    await graphqlRequest(nhost, UPDATE_MY_PROFILE, {
      id: profileId,
      changes: { onboarding_completed_at: new Date().toISOString() },
    })
    return true
  } catch (error) {
    if (
      isGraphqlMissingFieldError(error, 'onboarding_completed_at') ||
      isGraphqlMissingFieldError(error, 'profiles_set_input')
    ) {
      return false
    }

    throw error
  }
}

export async function completeAppOnboarding(
  nhost: NhostClient,
  profileId: string,
  data: ProfileOnboardingFormData,
) {
  const ensuredProfileId = await ensureUserProfile(nhost, profileId)

  if (hasOnboardingBodyData(data)) {
    const measurementsPatch = buildUserMeasurementsUpsertFromOnboarding(data)

    if (Object.keys(measurementsPatch).length > 0) {
      await graphqlRequest(nhost, UPSERT_USER_MEASUREMENTS, {
        object: measurementsPatch satisfies UserMeasurementsInput,
      })
    }

    const weightKg = parseOnboardingWeightKg(data)
    if (weightKg != null) {
      await graphqlRequest(nhost, INSERT_WEIGHT_ENTRY, {
        object: {
          weight_kg: weightKg,
          logged_at: new Date().toISOString(),
          source: 'manual',
        },
      })
    }
  }

  const rpcCompletedAt = await completeMyOnboardingViaRpc(nhost)
  if (rpcCompletedAt) {
    void queryClient.invalidateQueries({ queryKey: profileQueryKey(ensuredProfileId) })
    return
  }

  const updated = await completeMyOnboardingViaUpdate(nhost, ensuredProfileId)
  if (updated) {
    void queryClient.invalidateQueries({ queryKey: profileQueryKey(ensuredProfileId) })
    return
  }

  throw new Error(ONBOARDING_NOT_DEPLOYED_MESSAGE)
}

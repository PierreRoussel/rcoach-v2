import type { NhostClient } from '@nhost/nhost-js'

import {
  COMPLETE_MY_ONBOARDING,
  INSERT_WEIGHT_ENTRY,
  UPSERT_USER_MEASUREMENTS,
  type UserMeasurementsInput,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { queryClient } from '@/lib/query-client'
import { profileQueryKey } from '@/lib/auth/guard-profile'

import { ensureUserProfile } from './ensure-user-profile'
import {
  buildUserMeasurementsUpsertFromOnboarding,
  hasOnboardingBodyData,
  parseOnboardingWeightKg,
  type ProfileOnboardingFormData,
} from './profile-form'

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

  try {
    await graphqlRequest<{ complete_my_onboarding: string }>(
      nhost,
      COMPLETE_MY_ONBOARDING,
    )
  } catch {
    // Legacy stack without complete_my_onboarding RPC: fall back handled by guards cache invalidation.
    const { updateMyProfile } = await import('@/lib/graphql/profile-request')
    const updated = await updateMyProfile(nhost, ensuredProfileId, {
      onboarding_completed_at: new Date().toISOString(),
    })

    if (!updated) {
      throw new Error('Impossible de finaliser l’onboarding.')
    }
  }

  void queryClient.invalidateQueries({ queryKey: profileQueryKey(ensuredProfileId) })
}

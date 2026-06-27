import type { NhostClient } from '@nhost/nhost-js'

import {
  INSERT_WEIGHT_ENTRY,
  UPSERT_NUTRITION_SETTINGS,
  type NutritionSettingsInput,
  type ProfileUpdateInput,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { updateMyProfile } from '@/lib/graphql/profile-request'

import {
  buildNutritionUpsertFromOnboarding,
  hasOnboardingBodyData,
  type ProfileOnboardingFormData,
} from './profile-form'

export async function completeAppOnboarding(
  nhost: NhostClient,
  profileId: string,
  data: ProfileOnboardingFormData,
) {
  if (hasOnboardingBodyData(data)) {
    const nutritionPatch = buildNutritionUpsertFromOnboarding(data)

    await graphqlRequest(nhost, UPSERT_NUTRITION_SETTINGS, {
      object: nutritionPatch satisfies NutritionSettingsInput,
    })

    if (nutritionPatch.weight_kg != null) {
      await graphqlRequest(nhost, INSERT_WEIGHT_ENTRY, {
        object: {
          weight_kg: nutritionPatch.weight_kg,
          logged_at: new Date().toISOString(),
          source: 'manual',
        },
      })
    }
  }

  const profileChanges: ProfileUpdateInput = {
    onboarding_completed_at: new Date().toISOString(),
  }

  const updated = await updateMyProfile(nhost, profileId, profileChanges)

  if (!updated) {
    throw new Error('Impossible de finaliser l’onboarding.')
  }
}

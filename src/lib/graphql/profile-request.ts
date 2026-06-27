import type { NhostClient } from '@nhost/nhost-js'

import {
  GET_MY_PROFILE,
  GET_MY_PROFILE_LEGACY,
  GET_MY_PROFILE_ONBOARDING_LEGACY,
  UPDATE_MY_PROFILE,
  UPDATE_MY_PROFILE_LEGACY,
  UPDATE_MY_PROFILE_ONBOARDING_LEGACY,
  type Profile,
  type ProfileUpdateInput,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { DEFAULT_EXERCISE_LOCALE } from '@/lib/workout/exercise-translations'

function isExerciseLocaleSchemaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('exercise_locale')
}

function isOnboardingCompletedAtSchemaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('onboarding_completed_at')
}

function withDefaultExerciseLocale(
  profile: Omit<Profile, 'exercise_locale'> & { exercise_locale?: Profile['exercise_locale'] },
): Profile {
  return {
    ...profile,
    exercise_locale: profile.exercise_locale ?? DEFAULT_EXERCISE_LOCALE,
  }
}

function withOnboardingFallback(
  profile: Omit<Profile, 'onboarding_completed_at'> & {
    onboarding_completed_at?: Profile['onboarding_completed_at']
  },
  assumeCompleted: boolean,
): Profile {
  return {
    ...profile,
    onboarding_completed_at:
      profile.onboarding_completed_at ??
      (assumeCompleted ? new Date(0).toISOString() : null),
  }
}

export async function fetchMyProfile(
  nhost: NhostClient,
  userId: string,
): Promise<Profile | null> {
  try {
    const data = await graphqlRequest<{ profiles: Profile[] }>(nhost, GET_MY_PROFILE, {
      userId,
    })
    const profile = data.profiles[0]
    return profile ? withDefaultExerciseLocale(profile) : null
  } catch (error) {
    if (isOnboardingCompletedAtSchemaError(error)) {
      try {
        const data = await graphqlRequest<{
          profiles: Array<Omit<Profile, 'onboarding_completed_at'>>
        }>(nhost, GET_MY_PROFILE_ONBOARDING_LEGACY, { userId })
        const profile = data.profiles[0]
        return profile
          ? withOnboardingFallback(withDefaultExerciseLocale(profile), true)
          : null
      } catch (legacyError) {
        if (!isExerciseLocaleSchemaError(legacyError)) {
          throw legacyError
        }
      }
    }

    if (!isExerciseLocaleSchemaError(error)) {
      throw error
    }

    const data = await graphqlRequest<{
      profiles: Array<Omit<Profile, 'exercise_locale' | 'onboarding_completed_at'>>
    }>(nhost, GET_MY_PROFILE_LEGACY, { userId })
    const profile = data.profiles[0]
    return profile
      ? withOnboardingFallback(withDefaultExerciseLocale(profile), true)
      : null
  }
}

export async function updateMyProfile(
  nhost: NhostClient,
  profileId: string,
  changes: ProfileUpdateInput,
): Promise<Profile | null> {
  try {
    const data = await graphqlRequest<{ update_profiles_by_pk: Profile | null }>(
      nhost,
      UPDATE_MY_PROFILE,
      { id: profileId, changes },
    )
    const profile = data.update_profiles_by_pk
    return profile ? withDefaultExerciseLocale(profile) : null
  } catch (error) {
    if (isOnboardingCompletedAtSchemaError(error)) {
      const { onboarding_completed_at: _ignored, ...legacyChanges } = changes

      if (Object.keys(legacyChanges).length === 0) {
        return fetchMyProfile(nhost, profileId)
      }

      const data = await graphqlRequest<{
        update_profiles_by_pk: Omit<Profile, 'onboarding_completed_at'> | null
      }>(nhost, UPDATE_MY_PROFILE_ONBOARDING_LEGACY, {
        id: profileId,
        changes: legacyChanges,
      })

      const profile = data.update_profiles_by_pk
      return profile
        ? withOnboardingFallback(withDefaultExerciseLocale(profile), true)
        : null
    }

    if (!isExerciseLocaleSchemaError(error)) {
      throw error
    }

    const { exercise_locale: _ignoredLocale, ...legacyChanges } = changes
    const data = await graphqlRequest<{
      update_profiles_by_pk: Omit<Profile, 'exercise_locale'> | null
    }>(nhost, UPDATE_MY_PROFILE_LEGACY, { id: profileId, changes: legacyChanges })

    const profile = data.update_profiles_by_pk
    return profile ? withDefaultExerciseLocale(profile) : null
  }
}

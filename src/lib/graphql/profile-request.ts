import type { NhostClient } from '@nhost/nhost-js'

import {
  GET_MY_PROFILE,
  GET_MY_PROFILE_LEGACY,
  UPDATE_MY_PROFILE,
  UPDATE_MY_PROFILE_LEGACY,
  type Profile,
  type ProfileUpdateInput,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { DEFAULT_EXERCISE_LOCALE } from '@/lib/workout/exercise-translations'

function isExerciseLocaleSchemaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('exercise_locale')
}

function withDefaultExerciseLocale(
  profile: Omit<Profile, 'exercise_locale'> & { exercise_locale?: Profile['exercise_locale'] },
): Profile {
  return {
    ...profile,
    exercise_locale: profile.exercise_locale ?? DEFAULT_EXERCISE_LOCALE,
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
    if (!isExerciseLocaleSchemaError(error)) {
      throw error
    }

    const data = await graphqlRequest<{
      profiles: Array<Omit<Profile, 'exercise_locale'>>
    }>(nhost, GET_MY_PROFILE_LEGACY, { userId })
    const profile = data.profiles[0]
    return profile ? withDefaultExerciseLocale(profile) : null
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
    if (!isExerciseLocaleSchemaError(error)) {
      throw error
    }

    const { exercise_locale: _ignored, ...legacyChanges } = changes
    const data = await graphqlRequest<{
      update_profiles_by_pk: Omit<Profile, 'exercise_locale'> | null
    }>(nhost, UPDATE_MY_PROFILE_LEGACY, { id: profileId, changes: legacyChanges })

    const profile = data.update_profiles_by_pk
    return profile ? withDefaultExerciseLocale(profile) : null
  }
}

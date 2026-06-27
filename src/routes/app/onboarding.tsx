import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'

import { FeatureSlidesCarousel } from '@/components/onboarding/FeatureSlidesCarousel'
import { OnboardingSetupScreen } from '@/components/onboarding/OnboardingSetupScreen'
import { ProfileOnboardingSteps } from '@/components/onboarding/ProfileOnboardingSteps'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import {
  redirectIfAppOnboardingComplete,
  requireAuth,
} from '@/lib/auth/guards'
import { completeAppOnboarding } from '@/lib/onboarding/complete-onboarding'
import {
  createEmptyProfileOnboardingForm,
  hasStoredOnboardingBodyData,
  profileOnboardingFormFromStoredBodyData,
  type ProfileOnboardingFormData,
} from '@/lib/onboarding/profile-form'
import { resolveOnboardingProfileId } from '@/lib/onboarding/resolve-profile-id'
import { resolveDisplayName } from '@/lib/profile/resolve-display-name'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useMyProfile } from '@/hooks/useProfile'

export const Route = createFileRoute('/app/onboarding')({
  beforeLoad: async () => {
    requireAuth()
    await redirectIfAppOnboardingComplete()
  },
  component: OnboardingPage,
})

type OnboardingPhase = 'slides' | 'profile-check' | 'profile' | 'setup'

function OnboardingPage() {
  const { nhost, user, isLoading: authLoading } = useAuth()
  const { data: profile } = useMyProfile()
  const { data: nutritionSettings, isLoading: nutritionSettingsLoading } = useNutritionSettings()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<OnboardingPhase>('slides')
  const [pendingForm, setPendingForm] = useState<ProfileOnboardingFormData | null>(null)

  const displayName = resolveDisplayName(profile?.display_name, user)

  const beginSetup = useCallback((data: ProfileOnboardingFormData) => {
    setPendingForm(data)
    setPhase('setup')
  }, [])

  const continueAfterSlides = useCallback(() => {
    if (hasStoredOnboardingBodyData(nutritionSettings)) {
      beginSetup(createEmptyProfileOnboardingForm())
      return
    }

    setPhase('profile')
  }, [beginSetup, nutritionSettings])

  const advanceFromSlides = useCallback(() => {
    if (nutritionSettingsLoading) {
      setPhase('profile-check')
      return
    }

    continueAfterSlides()
  }, [continueAfterSlides, nutritionSettingsLoading])

  useEffect(() => {
    if (phase !== 'profile-check' || nutritionSettingsLoading) {
      return
    }

    continueAfterSlides()
  }, [continueAfterSlides, nutritionSettingsLoading, phase])

  const persistPendingForm = useCallback(async () => {
    if (!pendingForm) {
      throw new Error('Aucune donnée de profil à enregistrer.')
    }

    const profileId = await resolveOnboardingProfileId(nhost, user?.id, profile?.id)

    await completeAppOnboarding(nhost, profileId, pendingForm)

    await queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
    await queryClient.invalidateQueries({ queryKey: ['nutrition-settings'] })
  }, [nhost, pendingForm, profile?.id, queryClient, user?.id])

  async function goToApp() {
    await navigate({ to: '/app' })
  }

  if (phase === 'slides') {
    return (
      <FeatureSlidesCarousel
        onComplete={advanceFromSlides}
        onSkip={advanceFromSlides}
      />
    )
  }

  if (phase === 'profile-check') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gradient-hero px-6 text-center">
        <p className="text-sm text-muted-foreground">Préparation de votre profil...</p>
      </div>
    )
  }

  if (phase === 'setup' && pendingForm) {
    return (
      <OnboardingSetupScreen
        displayName={displayName}
        onPersist={persistPendingForm}
        onContinue={() => void goToApp()}
      />
    )
  }

  if (authLoading || !user?.id) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gradient-hero px-6 text-center">
        <p className="text-sm text-muted-foreground">Préparation de votre profil...</p>
      </div>
    )
  }

  return (
    <ProfileOnboardingSteps
      initialForm={profileOnboardingFormFromStoredBodyData(nutritionSettings)}
      onComplete={beginSetup}
      onSkipAll={() => beginSetup(createEmptyProfileOnboardingForm())}
    />
  )
}

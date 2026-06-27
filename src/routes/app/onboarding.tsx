import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { FeatureSlidesCarousel } from '@/components/onboarding/FeatureSlidesCarousel'
import { ProfileOnboardingSteps } from '@/components/onboarding/ProfileOnboardingSteps'
import {
  redirectIfAppOnboardingComplete,
  requireAuth,
} from '@/lib/auth/guards'
import { completeAppOnboarding } from '@/lib/onboarding/complete-onboarding'
import {
  createEmptyProfileOnboardingForm,
  type ProfileOnboardingFormData,
} from '@/lib/onboarding/profile-form'
import { resolveOnboardingProfileId } from '@/lib/onboarding/resolve-profile-id'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useMyProfile } from '@/hooks/useProfile'

export const Route = createFileRoute('/app/onboarding')({
  beforeLoad: async () => {
    requireAuth()
    await redirectIfAppOnboardingComplete()
  },
  component: OnboardingPage,
})

type OnboardingPhase = 'slides' | 'profile'

function OnboardingPage() {
  const { nhost, user, isLoading: authLoading } = useAuth()
  const { data: profile } = useMyProfile()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<OnboardingPhase>('slides')

  async function persistAndExit(data: ProfileOnboardingFormData) {
    const profileId = await resolveOnboardingProfileId(nhost, user?.id, profile?.id)

    await completeAppOnboarding(nhost, profileId, data)

    await queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
    await queryClient.invalidateQueries({ queryKey: ['nutrition-settings'] })

    await navigate({ to: '/app' })
  }

  async function skipAll() {
    await persistAndExit(createEmptyProfileOnboardingForm())
  }

  if (phase === 'slides') {
    return (
      <FeatureSlidesCarousel
        onComplete={() => setPhase('profile')}
        onSkip={() => setPhase('profile')}
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
      onComplete={persistAndExit}
      onSkipAll={skipAll}
    />
  )
}

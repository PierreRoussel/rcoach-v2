import { createFileRoute, useNavigate } from '@tanstack/react-router'
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
  const { nhost } = useAuth()
  const { data: profile } = useMyProfile()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<OnboardingPhase>('slides')

  async function persistAndExit(data: ProfileOnboardingFormData) {
    if (!profile?.id) {
      throw new Error('Profil introuvable.')
    }

    await completeAppOnboarding(nhost, profile.id, data)
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

  return (
    <ProfileOnboardingSteps
      onComplete={persistAndExit}
      onSkipAll={skipAll}
    />
  )
}

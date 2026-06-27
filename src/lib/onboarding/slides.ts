import { Dumbbell, CalendarDays, UtensilsCrossed, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type OnboardingFeatureSlide = {
  id: string
  title: string
  subtitle: string
  imageSrc: string
  icon: LucideIcon
}

export const ONBOARDING_FEATURE_SLIDES: OnboardingFeatureSlide[] = [
  {
    id: 'sessions',
    title: 'Séances',
    subtitle: 'Enregistrez vos séries, suivez votre séance en direct',
    imageSrc: '/onboarding/sessions.png',
    icon: Dumbbell,
  },
  {
    id: 'planning',
    title: 'Planification et statistiques',
    subtitle: 'Planifiez vos entraînements et visualisez vos progrès',
    imageSrc: '/onboarding/planning-stats.png',
    icon: CalendarDays,
  },
  {
    id: 'diet',
    title: 'Diète',
    subtitle: 'Suivez vos repas et vos macros au quotidien',
    imageSrc: '/onboarding/diet.png',
    icon: UtensilsCrossed,
  },
  {
    id: 'goals',
    title: 'Objectif',
    subtitle: 'Fixez un objectif de poids et suivez votre trajectoire',
    imageSrc: '/onboarding/goals.png',
    icon: Target,
  },
]

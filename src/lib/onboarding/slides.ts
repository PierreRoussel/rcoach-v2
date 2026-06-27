import { Dumbbell, CalendarDays, UtensilsCrossed, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type OnboardingFeatureSlide = {
  id: string
  title: string
  subtitle: string
  imageSrc: string
  icon: LucideIcon
  /** Solid circular badge (bg + icon color) matching slide hue */
  iconBadgeClass: string
  /** CSS background (gradients using theme tokens) */
  background: string
  /** 3D tilt applied to the screenshot */
  imageTilt: string
}

export const ONBOARDING_FEATURE_SLIDES: OnboardingFeatureSlide[] = [
  {
    id: 'sessions',
    title: 'Séances',
    subtitle: 'Enregistrez vos séries, suivez votre séance en direct',
    imageSrc: '/onboarding/sessions.png',
    icon: Dumbbell,
    iconBadgeClass: 'bg-primary text-primary-foreground',
    background:
      'linear-gradient(165deg, color-mix(in srgb, var(--primary) 38%, var(--soft-primary)) 0%, var(--soft-primary) 35%, color-mix(in srgb, var(--primary) 22%, var(--background)) 100%)',
    imageTilt: 'rotateY(-7deg) rotateZ(-2deg) rotateX(10deg)',
  },
  {
    id: 'planning',
    title: 'Planification et statistiques',
    subtitle: 'Planifiez vos entraînements et visualisez vos progrès',
    imageSrc: '/onboarding/planning-stats.png',
    icon: CalendarDays,
    iconBadgeClass: 'bg-chart-4 text-white',
    background:
      'linear-gradient(155deg, color-mix(in srgb, var(--chart-4) 42%, var(--soft-purple)) 0%, var(--soft-purple) 38%, color-mix(in srgb, var(--chart-4) 24%, var(--background)) 100%)',
    imageTilt: 'rotateY(6deg) rotateZ(1.5deg) rotateX(12deg)',
  },
  {
    id: 'diet',
    title: 'Diète',
    subtitle: 'Suivez vos repas et vos macros au quotidien',
    imageSrc: '/onboarding/diet.png',
    icon: UtensilsCrossed,
    iconBadgeClass: 'bg-secondary text-secondary-foreground',
    background:
      'linear-gradient(175deg, color-mix(in srgb, var(--secondary) 36%, var(--soft-secondary)) 0%, var(--soft-secondary) 36%, color-mix(in srgb, var(--secondary) 20%, var(--background)) 100%)',
    imageTilt: 'rotateY(-5deg) rotateZ(2deg) rotateX(9deg)',
  },
  {
    id: 'goals',
    title: 'Objectif',
    subtitle: 'Fixez un objectif de poids et suivez votre trajectoire',
    imageSrc: '/onboarding/goals.png',
    icon: Target,
    iconBadgeClass: 'bg-chart-5 text-white',
    background:
      'linear-gradient(165deg, color-mix(in srgb, var(--accent) 40%, var(--soft-accent)) 0%, var(--soft-peach) 42%, color-mix(in srgb, var(--chart-5) 35%, var(--soft-accent)) 100%)',
    imageTilt: 'rotateY(5deg) rotateZ(-1.5deg) rotateX(14deg)',
  },
]

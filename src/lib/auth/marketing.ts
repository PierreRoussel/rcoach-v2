export type AuthMarketingVariant = 'login' | 'register' | 'recovery'

export type AuthMarketingContent = {
  eyebrow: string
  headline: string
  description: string
  sheetTitle: string
}

export const AUTH_MARKETING_CONTENT: Record<AuthMarketingVariant, AuthMarketingContent> = {
  login: {
    eyebrow: 'Bon retour',
    headline: 'Courir plus, manger plus',
    description: 'Séances, diète et objectifs — tout votre coaching au même endroit.',
    sheetTitle: 'Connexion',
  },
  register: {
    eyebrow: 'Rejoindre RCoach',
    headline: 'Entraînez plus. Mangez mieux.',
    description: 'Suivez vos séries, vos repas et votre progression en un clin d’œil.',
    sheetTitle: 'Créer un compte',
  },
  recovery: {
    eyebrow: 'Sécurité du compte',
    headline: 'On vous remet sur les rails',
    description: 'Réinitialisez votre mot de passe en quelques secondes.',
    sheetTitle: 'Accès au compte',
  },
}

export const AUTH_FEATURE_PILLS = [
  { label: 'Séances live', imageSrc: '/onboarding/sessions.png' },
  { label: 'Diète & macros', imageSrc: '/onboarding/diet.png' },
  { label: 'Objectif poids', imageSrc: '/onboarding/goals.png' },
] as const

export const AUTH_HERO_MOCKUPS = [
  {
    imageSrc: '/onboarding/diet.png',
    alt: 'Suivi nutrition',
    className: 'absolute left-0 top-6 z-10 w-[38%] -rotate-6 opacity-90',
  },
  {
    imageSrc: '/onboarding/sessions.png',
    alt: 'Séance en cours',
    className: 'relative z-20 mx-auto w-[52%]',
  },
  {
    imageSrc: '/onboarding/goals.png',
    alt: 'Objectif de poids',
    className: 'absolute right-0 top-6 z-10 w-[38%] rotate-6 opacity-90',
  },
] as const

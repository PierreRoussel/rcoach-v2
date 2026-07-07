import type { PremiumFeature } from '@/lib/subscription/entitlements'

export type BillingPeriod = 'monthly' | 'annual'

export type PlanTier = 'free' | 'premium'

export type PlanDefinition = {
  id: PlanTier
  name: string
  description: string
  monthlyPriceCents: number
  annualPriceCents: number
  trialDays: number
  features: string[]
  entitlements: PremiumFeature[]
}

export const PREMIUM_PLAN: PlanDefinition = {
  id: 'premium',
  name: 'Premium',
  description: 'Progressez plus vite avec un accompagnement complet.',
  monthlyPriceCents: 999,
  annualPriceCents: 4999,
  trialDays: 7,
  features: [
    'Ajustement illimité des charges',
    'Statistiques avancées',
    'Historique illimité',
    'Programmes personnalisés illimités',
    'Conseils intelligents',
    'Thème Pro et badge sur votre avatar',
  ],
  entitlements: [
    'overload_suggestions',
    'advanced_stats',
    'unlimited_history',
    'unlimited_planning',
    'ai_advice',
    'premium_themes',
    'pro_badge',
  ],
}

export const FREE_PLAN: PlanDefinition = {
  id: 'free',
  name: 'Gratuit',
  description: 'L’essentiel pour suivre vos séances et votre nutrition.',
  monthlyPriceCents: 0,
  annualPriceCents: 0,
  trialDays: 0,
  features: [
    'Suivi des séances',
    'Nutrition de base',
    '1 conseil de charge par jour',
    'Historique sur 4 semaines',
    '1 programme actif',
  ],
  entitlements: [],
}

export const COMPARE_FEATURES = [
  { id: 'overload', label: 'Ajustement des charges', free: '1/jour', premium: 'Illimité' },
  { id: 'stats', label: 'Statistiques avancées', free: false, premium: true },
  { id: 'history', label: 'Historique des séances', free: '4 semaines', premium: 'Illimité' },
  { id: 'planning', label: 'Programmes actifs', free: '1', premium: 'Illimité' },
  { id: 'ai', label: 'Conseils intelligents', free: false, premium: true },
  { id: 'themes', label: 'Thème Pro', free: false, premium: true },
  { id: 'badge', label: 'Badge Pro sur l’avatar', free: false, premium: true },
] as const

export function formatPriceEuros(cents: number): string {
  if (cents === 0) {
    return '0 €'
  }

  const euros = cents / 100
  return euros % 1 === 0 ? `${euros} €` : `${euros.toFixed(2).replace('.', ',')} €`
}

export function annualSavingsPercent(plan: PlanDefinition): number {
  if (plan.monthlyPriceCents === 0) {
    return 0
  }

  const monthlyTotal = plan.monthlyPriceCents * 12
  const savings = monthlyTotal - plan.annualPriceCents
  return Math.round((savings / monthlyTotal) * 100)
}

export function monthlyEquivalentFromAnnual(plan: PlanDefinition): string {
  const monthlyCents = Math.round(plan.annualPriceCents / 12)
  return formatPriceEuros(monthlyCents)
}

import { Coffee, Moon, Soup, UtensilsCrossed, type LucideIcon } from 'lucide-react'

import type { MealType } from '@/lib/nutrition/types'

export const MEAL_ICONS: Record<MealType, LucideIcon> = {
  breakfast: Coffee,
  lunch: Soup,
  snack: UtensilsCrossed,
  dinner: Moon,
}

export const MEAL_ICON_TINT: Record<MealType, string> = {
  breakfast: 'bg-soft-accent text-accent',
  lunch: 'bg-soft-secondary text-secondary',
  snack: 'bg-soft-primary text-primary',
  dinner: 'bg-soft-purple text-[#6b4fcc]',
}

export const MEAL_CARD_TINT: Record<MealType, string> = {
  breakfast: 'bg-soft-accent/40',
  lunch: 'bg-soft-secondary/40',
  snack: 'bg-soft-primary/40',
  dinner: 'bg-soft-purple/40',
}

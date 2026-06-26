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
  snack: 'bg-soft-peach text-[#b87848]',
  dinner: 'bg-soft-purple text-[#6b4fcc]',
}

export const MEAL_RING_STROKE: Record<MealType, string> = {
  breakfast: 'text-accent',
  lunch: 'text-secondary',
  snack: 'text-[#b87848]',
  dinner: 'text-[#6b4fcc]',
}

export const MEAL_CARD_TINT: Record<MealType, string> = {
  breakfast: 'bg-soft-accent/40',
  lunch: 'bg-soft-secondary/40',
  snack: 'bg-soft-peach/40',
  dinner: 'bg-soft-purple/40',
}

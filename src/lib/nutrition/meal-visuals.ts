import { Coffee, Moon, Soup, UtensilsCrossed, type LucideIcon } from 'lucide-react'

import type { MealType } from '@/lib/nutrition/types'

/** Canonical meal accent — used for icons, rings, sliders (hex for reliable SVG). */
export const MEAL_COLOR: Record<MealType, string> = {
  breakfast: '#e8b84b',
  lunch: '#1aae8a',
  snack: '#b87848',
  dinner: '#9b78c8',
}

/** Ring track (0 % progress) — light tint of the meal color. */
export const MEAL_RING_TRACK_COLOR: Record<MealType, string> = {
  breakfast: 'rgba(232, 184, 75, 0.28)',
  lunch: 'rgba(26, 174, 138, 0.28)',
  snack: 'rgba(184, 120, 72, 0.28)',
  dinner: 'rgba(155, 120, 200, 0.28)',
}

export const MEAL_ICONS: Record<MealType, LucideIcon> = {
  breakfast: Coffee,
  lunch: Soup,
  snack: UtensilsCrossed,
  dinner: Moon,
}

export const MEAL_ICON_TINT: Record<MealType, string> = {
  breakfast: 'bg-soft-accent text-[#e8b84b]',
  lunch: 'bg-soft-secondary text-[#1aae8a]',
  snack: 'bg-soft-peach text-[#b87848]',
  dinner: 'bg-soft-purple text-[#9b78c8]',
}

export const MEAL_RING_STROKE: Record<MealType, string> = {
  breakfast: 'text-[#e8b84b]',
  lunch: 'text-[#1aae8a]',
  snack: 'text-[#b87848]',
  dinner: 'text-[#9b78c8]',
}

/** @deprecated Prefer MEAL_COLOR — kept for SVG stroke attributes. */
export const MEAL_RING_COLOR: Record<MealType, string> = { ...MEAL_COLOR }

export const MEAL_CARD_TINT: Record<MealType, string> = {
  breakfast: 'bg-soft-accent/40',
  lunch: 'bg-soft-secondary/40',
  snack: 'bg-soft-peach/40',
  dinner: 'bg-soft-purple/40',
}

export const MEAL_SLIDER_RANGE: Record<MealType, string> = {
  breakfast: 'bg-[#e8b84b]',
  lunch: 'bg-[#1aae8a]',
  snack: 'bg-[#b87848]',
  dinner: 'bg-[#9b78c8]',
}

export const MEAL_SLIDER_THUMB: Record<MealType, string> = {
  breakfast: 'border-[#e8b84b]',
  lunch: 'border-[#1aae8a]',
  snack: 'border-[#b87848]',
  dinner: 'border-[#9b78c8]',
}

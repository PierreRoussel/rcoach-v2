import { TriangleAlert } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getFoodNutrientWarning,
  type FoodNutrientFieldKey,
  type FoodNutrientInputValues,
} from '@/lib/nutrition/food-nutrient-warnings'
import { cn } from '@/lib/utils'

type FoodNutrientFieldProps = {
  field: FoodNutrientFieldKey
  label: string
  value: string
  allValues: FoodNutrientInputValues
  hint?: string | null
  onChange: (value: string) => void
}

export function FoodNutrientField({
  field,
  label,
  value,
  allValues,
  hint,
  onChange,
}: FoodNutrientFieldProps) {
  const warning = hint ?? getFoodNutrientWarning(field, value, allValues)
  const inputId = `food-nutrient-${field}`

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Input
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="decimal"
          aria-invalid={warning ? true : undefined}
          aria-describedby={warning ? `${inputId}-warning` : undefined}
          className={cn(warning && 'border-amber-500 pr-9 focus-visible:border-amber-500 focus-visible:ring-amber-500/30')}
        />
        {warning ? (
          <TriangleAlert
            className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-amber-600"
            aria-hidden
          />
        ) : null}
      </div>
      {warning ? (
        <p id={`${inputId}-warning`} className="text-xs leading-snug text-amber-700 dark:text-amber-400">
          {warning}
        </p>
      ) : null}
    </div>
  )
}

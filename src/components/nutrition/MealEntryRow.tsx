import { Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatNutrient } from '@/lib/nutrition/nutrient-math'

type MealEntryRowProps = {
  name: string
  brand: string | null
  calories: number
  quantityG: number | null
  servings: number | null
  onEdit?: () => void
  onDelete?: () => void
}

function formatQuantity(quantityG: number | null, servings: number | null) {
  if (quantityG != null) {
    return `${formatNutrient(quantityG)} g`
  }

  if (servings != null) {
    return `${formatNutrient(servings)} portion${servings > 1 ? 's' : ''}`
  }

  return ''
}

export function MealEntryRow({
  name,
  brand,
  calories,
  quantityG,
  servings,
  onEdit,
  onDelete,
}: MealEntryRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-foreground">{name}</div>
        <div className="text-xs text-muted-foreground">
          {[brand, formatQuantity(quantityG, servings)].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div className="text-sm font-semibold text-foreground">{Math.round(calories)} Cal</div>
      {onEdit ? (
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
      ) : null}
      {onDelete ? (
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onDelete}>
          <Trash2 className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}

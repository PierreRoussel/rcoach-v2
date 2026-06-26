import { Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatNutrient } from '@/lib/nutrition/nutrient-math'
import { cn } from '@/lib/utils'

type MealEntryRowProps = {
  name: string
  brand: string | null
  calories: number
  quantityG: number | null
  servings: number | null
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
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
  onSelect,
  onEdit,
  onDelete,
  className,
}: MealEntryRowProps) {
  const meta = [brand, formatQuantity(quantityG, servings)].filter(Boolean).join(' · ')

  const mainContent = (
    <>
      <div className="truncate font-display text-sm font-bold text-foreground">{name}</div>
      {meta ? <div className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</div> : null}
    </>
  )

  return (
    <div
      className={cn(
        'flex w-full items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/20 active:bg-muted/30',
        className,
      )}
    >
      {onSelect ? (
        <button
          type="button"
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg"
          onClick={onSelect}
        >
          {mainContent}
        </button>
      ) : (
        <div className="min-w-0 flex-1">{mainContent}</div>
      )}

      {onSelect ? (
        <button
          type="button"
          className="shrink-0 rounded-lg bg-muted px-2.5 py-1 text-xs font-bold tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={onSelect}
        >
          {Math.round(calories)} Cal
        </button>
      ) : (
        <div className="shrink-0 rounded-lg bg-muted px-2.5 py-1 text-xs font-bold tabular-nums text-foreground">
          {Math.round(calories)} Cal
        </div>
      )}

      <div className="flex shrink-0 items-center gap-0.5">
        {onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            onClick={onEdit}
            aria-label="Modifier la portion"
          >
            <Pencil className="size-4" />
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label="Supprimer l'aliment"
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

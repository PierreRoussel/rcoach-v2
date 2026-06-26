import { Barcode, Check, Loader2, Plus, Search, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { FoodSearchResult } from '@/hooks/useFoodSearch'
import { formatFoodPortionPreview } from '@/lib/nutrition/frequent-portion'
import { cn } from '@/lib/utils'

export type FoodQuickAddState = {
  foodId: string
  status: 'adding' | 'success'
} | null

type FoodSearchListProps = {
  results: FoodSearchResult[]
  favoriteFoodIds?: Set<string>
  onSelect: (result: FoodSearchResult) => void
  onQuickAdd?: (result: FoodSearchResult) => void
  quickAddState?: FoodQuickAddState
  onToggleFavorite?: (result: FoodSearchResult) => void
  emptyLabel?: string
  className?: string
}

function formatPortionLine(result: FoodSearchResult) {
  const portion = result.quickAddPortion ?? { mode: 'servings' as const, servings: 1 }

  return formatFoodPortionPreview(
    {
      calories: result.calories,
      carbs_g: result.carbsG,
      protein_g: result.proteinG,
      fat_g: result.fatG,
      serving_size_g: result.servingSizeG,
    },
    portion,
  )
}

function QuickAddButton({
  result,
  quickAddState,
  onQuickAdd,
}: {
  result: FoodSearchResult
  quickAddState: FoodQuickAddState
  onQuickAdd: (result: FoodSearchResult) => void
}) {
  const rowStatus = quickAddState?.foodId === result.id ? quickAddState.status : null

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        'size-8 shrink-0 rounded-full transition-colors',
        rowStatus === 'success' && 'border-primary bg-soft-primary text-primary',
      )}
      disabled={rowStatus === 'adding' || rowStatus === 'success'}
      onClick={() => onQuickAdd(result)}
      aria-label={
        rowStatus === 'success'
          ? `${result.name} ajouté`
          : `Ajouter ${result.name}`
      }
    >
      {rowStatus === 'adding' ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : rowStatus === 'success' ? (
        <Check className="size-4 animate-motivation-pop" aria-hidden />
      ) : (
        <Plus className="size-4" aria-hidden />
      )}
    </Button>
  )
}

export function FoodSearchList({
  results,
  favoriteFoodIds,
  onSelect,
  onQuickAdd,
  quickAddState = null,
  onToggleFavorite,
  emptyLabel = 'Aucun aliment trouvé.',
  className,
}: FoodSearchListProps) {
  if (results.length === 0) {
    return <p className={cn('px-1 py-6 text-center text-sm text-muted-foreground', className)}>{emptyLabel}</p>
  }

  return (
    <div className={cn('divide-y divide-border/70', className)}>
      {results.map((result) => {
        const favoriteId = result.food?.id ?? null
        const isFavorite = favoriteId ? favoriteFoodIds?.has(favoriteId) : false

        return (
          <div key={result.id} className="flex items-center gap-3 py-3">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => onSelect(result)}
            >
              <div className="truncate font-semibold text-foreground">{result.name}</div>
              <div className="text-xs text-muted-foreground">
                {[result.brand, formatPortionLine(result)].filter(Boolean).join(' · ')}
              </div>
            </button>
            {onToggleFavorite && favoriteId ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => onToggleFavorite(result)}
              >
                <Star className={cn('size-4', isFavorite && 'fill-primary text-primary')} />
              </Button>
            ) : null}
            {onQuickAdd ? (
              <QuickAddButton
                result={result}
                quickAddState={quickAddState}
                onQuickAdd={onQuickAdd}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function FoodQuickActions({
  onSearchFocus,
  onScan,
  onCreate,
}: {
  onSearchFocus?: () => void
  onScan?: () => void
  onCreate?: () => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button type="button" variant="outline" className="h-auto flex-col gap-1 py-3" onClick={onSearchFocus}>
        <Search className="size-4" />
        <span className="text-xs">Rechercher</span>
      </Button>
      <Button type="button" variant="outline" className="h-auto flex-col gap-1 py-3" onClick={onScan}>
        <Barcode className="size-4" />
        <span className="text-xs">Code-barres</span>
      </Button>
      <Button type="button" variant="outline" className="h-auto flex-col gap-1 py-3" onClick={onCreate}>
        <Plus className="size-4" />
        <span className="text-xs">Nouvel aliment</span>
      </Button>
    </div>
  )
}

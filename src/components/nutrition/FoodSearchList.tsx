import { Barcode, Plus, Search, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { FoodSearchResult } from '@/hooks/useFoodSearch'
import { cn } from '@/lib/utils'

type FoodSearchListProps = {
  results: FoodSearchResult[]
  favoriteFoodIds?: Set<string>
  onSelect: (result: FoodSearchResult) => void
  onToggleFavorite?: (result: FoodSearchResult) => void
  emptyLabel?: string
  className?: string
}

export function FoodSearchList({
  results,
  favoriteFoodIds,
  onSelect,
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
                {[result.brand, `${Math.round(result.calories)} kcal / 100 g`].filter(Boolean).join(' · ')}
              </div>
            </button>
            {onToggleFavorite && favoriteId ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => onToggleFavorite(result)}
              >
                <Star className={cn('size-4', isFavorite && 'fill-primary text-primary')} />
              </Button>
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

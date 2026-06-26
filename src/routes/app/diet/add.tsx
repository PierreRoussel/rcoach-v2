import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { FoodQuickActions, FoodSearchList } from '@/components/nutrition/FoodSearchList'
import { PortionPickerSheet } from '@/components/nutrition/PortionPickerSheet'
import { QuickAddSheet } from '@/components/nutrition/QuickAddSheet'
import { SwipeableTabPanels } from '@/components/sessions/SwipeableTabPanels'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useFoodFavorites, useFoodFavoriteMutations, useFoodMutations } from '@/hooks/useFoodFavorites'
import { useFrequentFoods } from '@/hooks/useFrequentFoods'
import { useRecentFoods } from '@/hooks/useRecentFoods'
import { useFoodSearch, OFF_MIN_QUERY_LENGTH, type FoodSearchResult } from '@/hooks/useFoodSearch'
import { useMealLogMutations } from '@/hooks/useMealLogMutations'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { toDateKey } from '@/lib/nutrition/dates'
import type { Food, MealType } from '@/lib/nutrition/types'

const addSearchSchema = z.object({
  date: z.string().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'snack', 'dinner']).optional(),
  tab: z.enum(['frequent', 'recent', 'favorites']).optional(),
})

type AddFoodTab = 'frequent' | 'recent' | 'favorites'

function mapFoodToSearchResult(food: Food): FoodSearchResult {
  return {
    id: food.id,
    name: food.name,
    brand: food.brand,
    calories: Number(food.calories),
    carbsG: Number(food.carbs_g),
    proteinG: Number(food.protein_g),
    fatG: Number(food.fat_g),
    servingSizeG: Number(food.serving_size_g),
    servingLabel: food.serving_label,
    source: food.source,
    barcode: food.barcode,
    offProductId: food.off_product_id,
    food,
  }
}

export const Route = createFileRoute('/app/diet/add')({
  validateSearch: addSearchSchema,
  component: AddFoodPage,
})

function AddFoodPage() {
  const navigate = useNavigate({ from: '/app/diet/add' })
  const search = Route.useSearch()
  const date = search.date ?? toDateKey(new Date())
  const mealType = (search.mealType ?? 'breakfast') as MealType
  const activeTab = search.tab ?? 'frequent'
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [searchOffExternally, setSearchOffExternally] = useState(false)
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const trimmedQuery = query.trim()
  const { results, isLoading, canTriggerOffSearch } = useFoodSearch(query, true, {
    searchOffExternally,
  })
  const { data: favorites = [] } = useFoodFavorites()
  const { data: frequentFoods = [] } = useFrequentFoods(20)
  const { data: recentFoods = [] } = useRecentFoods(20)
  const { toggleFavorite } = useFoodFavoriteMutations()
  const { ensureOffFood, lookupBarcode } = useFoodMutations()
  const { addEntry, addQuickEntry } = useMealLogMutations()
  const { requestScan, scanner } = useBarcodeScanner()

  useEffect(() => {
    setSearchOffExternally(false)
  }, [trimmedQuery])

  const favoriteFoodIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.food_id)),
    [favorites],
  )

  const favoriteResults = useMemo<FoodSearchResult[]>(
    () => favorites.map((favorite) => mapFoodToSearchResult(favorite.food)),
    [favorites],
  )

  const frequentResults = useMemo<FoodSearchResult[]>(
    () => frequentFoods.map(mapFoodToSearchResult),
    [frequentFoods],
  )

  const recentResults = useMemo<FoodSearchResult[]>(
    () => recentFoods.map(mapFoodToSearchResult),
    [recentFoods],
  )

  const handleToggleFavorite = (result: FoodSearchResult) => {
    if (!result.food) {
      return
    }

    const favorite = favorites.find((item) => item.food_id === result.food!.id)
    void toggleFavorite.mutateAsync({
      foodId: result.food.id,
      favoriteId: favorite?.id,
    })
  }

  const browseTabs = useMemo(
    () => [
      {
        id: 'frequent' as const,
        label: 'Fréquents',
        panel: (
          <FoodSearchList
            results={frequentResults}
            favoriteFoodIds={favoriteFoodIds}
            onSelect={(result) => void handleSelect(result)}
            onToggleFavorite={handleToggleFavorite}
            emptyLabel="Vos aliments fréquents apparaîtront ici."
          />
        ),
      },
      {
        id: 'recent' as const,
        label: 'Récents',
        panel: (
          <FoodSearchList
            results={recentResults}
            favoriteFoodIds={favoriteFoodIds}
            onSelect={(result) => void handleSelect(result)}
            onToggleFavorite={handleToggleFavorite}
            emptyLabel="Vos derniers aliments journalisés apparaîtront ici."
          />
        ),
      },
      {
        id: 'favorites' as const,
        label: 'Favoris',
        panel: (
          <FoodSearchList
            results={favoriteResults}
            favoriteFoodIds={favoriteFoodIds}
            onSelect={(result) => void handleSelect(result)}
            onToggleFavorite={handleToggleFavorite}
            emptyLabel="Aucun favori pour le moment."
          />
        ),
      },
    ],
    [favoriteFoodIds, favoriteResults, frequentResults, recentResults, favorites],
  )

  const handleBrowseTabChange = (nextTab: AddFoodTab) => {
    void navigate({
      search: (current) => ({
        ...current,
        tab: nextTab,
      }),
      replace: true,
    })
  }

  async function resolveFood(result: FoodSearchResult) {
    if (result.food) {
      return result.food
    }

    if (result.offDraft) {
      return ensureOffFood(result.offDraft)
    }

    return null
  }

  async function handleSelect(result: FoodSearchResult) {
    setMessage(null)
    const food = await resolveFood(result)
    if (!food) {
      setMessage('Impossible de charger cet aliment.')
      return
    }

    setSelectedFood(food)
  }

  async function handleScan() {
    setMessage(null)

    try {
      const barcode = await requestScan()
      if (!barcode) {
        return
      }

      const food = await lookupBarcode(barcode)
      if (food) {
        setSelectedFood(food)
        return
      }

      void navigate({
        to: '/app/diet/foods/new',
        search: { date, mealType, barcode, mode: 'barcode' },
      })
    } catch (scanError) {
      setMessage(
        scanError instanceof Error ? scanError.message : 'Scan code-barres impossible.',
      )
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-9 shrink-0" asChild>
          {search.mealType ? (
            <Link
              to="/app/diet/meals/$mealType"
              params={{ mealType: search.mealType }}
              search={{ date }}
              aria-label="Retour au repas"
            >
              <ArrowLeft className="size-5" />
            </Link>
          ) : (
            <Link to="/app/diet" search={{ date }} aria-label="Retour au journal">
              <ArrowLeft className="size-5" />
            </Link>
          )}
        </Button>
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-2xl font-black text-foreground">Ajouter un aliment</h1>
          <p className="text-sm text-muted-foreground">
            Recherchez, scannez ou créez un aliment.
          </p>
        </div>
      </div>

      <Input
        ref={searchInputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Rechercher un aliment..."
      />

      <FoodQuickActions
        onSearchFocus={() => searchInputRef.current?.focus()}
        onScan={() => void handleScan()}
        onCreate={() =>
          void navigate({
            to: '/app/diet/foods/new',
            search: { date, mealType, mode: 'manual' },
          })
        }
      />

      {canTriggerOffSearch ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setSearchOffExternally(true)}
        >
          Rechercher dans Open Food Facts
        </Button>
      ) : null}

      {message ? <p className="text-sm text-destructive">{message}</p> : null}

      {trimmedQuery.length < 2 ? (
        <SwipeableTabPanels
          value={activeTab}
          onChange={handleBrowseTabChange}
          tabs={browseTabs}
        />
      ) : (
        <FoodSearchList
          results={results}
          favoriteFoodIds={favoriteFoodIds}
          onSelect={(result) => void handleSelect(result)}
          onToggleFavorite={handleToggleFavorite}
          emptyLabel={isLoading ? 'Recherche en cours...' : 'Aucun résultat.'}
        />
      )}

      {trimmedQuery.length >= OFF_MIN_QUERY_LENGTH &&
      !isLoading &&
      results.length === 0 ? (
        <p className="px-1 text-center text-xs text-muted-foreground">
          Aucun aliment local. La recherche Open Food Facts est lancée automatiquement à partir de{' '}
          {OFF_MIN_QUERY_LENGTH} caractères.
        </p>
      ) : null}

      <PortionPickerSheet
        open={Boolean(selectedFood)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedFood(null)
          }
        }}
        food={selectedFood}
        isSubmitting={addEntry.isPending}
        onConfirm={(portion) => {
          if (!selectedFood) {
            return
          }

          void addEntry
            .mutateAsync({
              loggedDate: date,
              mealType,
              food: selectedFood,
              portion,
            })
            .then((result) => {
              setSelectedFood(null)
              if (result.offline) {
                setMessage('Enregistré localement. Synchronisation à la reconnexion.')
              }
              void navigate({
                to: '/app/diet/meals/$mealType',
                params: { mealType },
                search: { date },
              })
            })
            .catch((error: Error) => setMessage(error.message))
        }}
      />

      <QuickAddSheet
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        isSubmitting={addQuickEntry.isPending}
        onConfirm={(values) => {
          void addQuickEntry
            .mutateAsync({
              loggedDate: date,
              mealType,
              name: values.name,
              calories: values.calories,
              carbsG: values.carbsG,
              proteinG: values.proteinG,
              fatG: values.fatG,
            })
            .then((result) => {
              setQuickAddOpen(false)
              if (result.offline) {
                setMessage('Enregistré localement. Synchronisation à la reconnexion.')
              }
              void navigate({
                to: '/app/diet/meals/$mealType',
                params: { mealType },
                search: { date },
              })
            })
            .catch((error: Error) => setMessage(error.message))
        }}
      />

      <Button
        type="button"
        size="icon"
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)] right-4 z-30 size-14 rounded-full shadow-lg"
        onClick={() => setQuickAddOpen(true)}
        aria-label="Ajout rapide"
      >
        <Zap className="size-6" />
      </Button>

      {scanner}
    </div>
  )
}

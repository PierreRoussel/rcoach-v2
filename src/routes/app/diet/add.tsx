import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { FoodQuickActions, FoodSearchList } from '@/components/nutrition/FoodSearchList'
import { PortionPickerSheet } from '@/components/nutrition/PortionPickerSheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useFoodFavorites, useFoodFavoriteMutations, useFoodMutations } from '@/hooks/useFoodFavorites'
import { useFrequentFoods } from '@/hooks/useFrequentFoods'
import { useFoodSearch, type FoodSearchResult } from '@/hooks/useFoodSearch'
import { useMealLogMutations } from '@/hooks/useMealLogMutations'
import { scanBarcode } from '@/lib/nutrition/barcode-scanner'
import { toDateKey } from '@/lib/nutrition/dates'
import type { Food, MealType } from '@/lib/nutrition/types'

const addSearchSchema = z.object({
  date: z.string().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'snack', 'dinner']).optional(),
})

export const Route = createFileRoute('/app/diet/add')({
  validateSearch: addSearchSchema,
  component: AddFoodPage,
})

function AddFoodPage() {
  const navigate = useNavigate({ from: '/app/diet/add' })
  const search = Route.useSearch()
  const date = search.date ?? toDateKey(new Date())
  const mealType = (search.mealType ?? 'breakfast') as MealType
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const { results, isLoading } = useFoodSearch(query)
  const { data: favorites = [] } = useFoodFavorites()
  const { data: frequentFoods = [] } = useFrequentFoods()
  const { toggleFavorite } = useFoodFavoriteMutations()
  const { ensureOffFood, lookupBarcode } = useFoodMutations()
  const { addEntry } = useMealLogMutations()

  const favoriteFoodIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.food_id)),
    [favorites],
  )

  const favoriteResults = useMemo<FoodSearchResult[]>(
    () =>
      favorites.map((favorite) => ({
        id: favorite.food.id,
        name: favorite.food.name,
        brand: favorite.food.brand,
        calories: Number(favorite.food.calories),
        carbsG: Number(favorite.food.carbs_g),
        proteinG: Number(favorite.food.protein_g),
        fatG: Number(favorite.food.fat_g),
        servingSizeG: Number(favorite.food.serving_size_g),
        servingLabel: favorite.food.serving_label,
        source: favorite.food.source,
        barcode: favorite.food.barcode,
        offProductId: favorite.food.off_product_id,
        food: favorite.food,
      })),
    [favorites],
  )

  const frequentResults = useMemo<FoodSearchResult[]>(
    () =>
      frequentFoods.map((food) => ({
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
      })),
    [frequentFoods],
  )

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
      const barcode = await scanBarcode()
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
    <div className="space-y-4 pb-8">
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
            Recherchez, scannez ou creez un aliment.
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

      {message ? <p className="text-sm text-destructive">{message}</p> : null}

      {query.trim().length < 2 ? (
        <div className="space-y-6">
          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Favoris
            </h2>
            <FoodSearchList
              results={favoriteResults}
              favoriteFoodIds={favoriteFoodIds}
              onSelect={(result) => void handleSelect(result)}
              onToggleFavorite={(result) => {
                if (!result.food) {
                  return
                }

                const favorite = favorites.find((item) => item.food_id === result.food!.id)
                void toggleFavorite.mutateAsync({
                  foodId: result.food.id,
                  favoriteId: favorite?.id,
                })
              }}
              emptyLabel="Aucun favori pour le moment."
            />
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Frequents
            </h2>
            <FoodSearchList
              results={frequentResults}
              favoriteFoodIds={favoriteFoodIds}
              onSelect={(result) => void handleSelect(result)}
              onToggleFavorite={(result) => {
                if (!result.food) {
                  return
                }

                const favorite = favorites.find((item) => item.food_id === result.food!.id)
                void toggleFavorite.mutateAsync({
                  foodId: result.food.id,
                  favoriteId: favorite?.id,
                })
              }}
              emptyLabel="Vos aliments frequents apparaitront ici."
            />
          </section>
        </div>
      ) : (
        <FoodSearchList
          results={results}
          favoriteFoodIds={favoriteFoodIds}
          onSelect={(result) => void handleSelect(result)}
          onToggleFavorite={(result) => {
            if (!result.food) {
              return
            }

            const favorite = favorites.find((item) => item.food_id === result.food!.id)
            void toggleFavorite.mutateAsync({
              foodId: result.food.id,
              favoriteId: favorite?.id,
            })
          }}
          emptyLabel={isLoading ? 'Recherche en cours...' : 'Aucun resultat.'}
        />
      )}

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
                setMessage('Enregistre localement. Synchronisation a la reconnexion.')
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
    </div>
  )
}

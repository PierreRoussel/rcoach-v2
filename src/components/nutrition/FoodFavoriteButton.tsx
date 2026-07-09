import { Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useFoodFavorites, useFoodFavoriteMutations } from '@/hooks/useFoodFavorites'
import { cn } from '@/lib/utils'

type FoodFavoriteButtonProps = {
  foodId: string
  className?: string
}

export function FoodFavoriteButton({ foodId, className }: FoodFavoriteButtonProps) {
  const { data: favorites = [] } = useFoodFavorites()
  const { toggleFavorite } = useFoodFavoriteMutations()
  const favorite = favorites.find((item) => item.food_id === foodId)
  const isFavorite = Boolean(favorite)

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('size-8 shrink-0 rounded-full', className)}
      disabled={toggleFavorite.isPending}
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      onClick={() => {
        void toggleFavorite.mutateAsync({
          foodId,
          favoriteId: favorite?.id,
        })
      }}
    >
      <Star className={cn('size-4', isFavorite && 'fill-primary text-primary')} />
    </Button>
  )
}

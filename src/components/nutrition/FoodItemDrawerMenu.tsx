import { MoreVertical, PencilLine, Scale } from 'lucide-react'
import { useState } from 'react'

import { FoodPortionTypeDialog } from '@/components/nutrition/FoodPortionTypeDialog'
import { FoodRenameProposalDialog } from '@/components/nutrition/FoodRenameProposalDialog'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFoodRenameAndPortionMutations } from '@/hooks/useFoodRenameAndPortions'
import { formatNutrient } from '@/lib/nutrition/nutrient-math'
import type { Food } from '@/lib/nutrition/types'

type FoodItemDrawerMenuProps = {
  food: Food
}

export function FoodItemDrawerMenu({ food }: FoodItemDrawerMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [portionDialogOpen, setPortionDialogOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { proposeRename, addPortionType } = useFoodRenameAndPortionMutations()

  const isBusy = proposeRename.isPending || addPortionType.isPending

  return (
    <div
      className="flex flex-col items-end gap-1"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            aria-label="Actions sur l’aliment"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem
            disabled={isBusy}
            onClick={() => {
              setMenuOpen(false)
              setRenameDialogOpen(true)
            }}
          >
            <PencilLine className="size-4" />
            Proposer un renommage
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isBusy}
            onClick={() => {
              setMenuOpen(false)
              setPortionDialogOpen(true)
            }}
          >
            <Scale className="size-4" />
            Ajouter un type de portion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {message ? (
        <FeedbackMessage variant="success" className="max-w-40 text-right text-xs">
          {message}
        </FeedbackMessage>
      ) : null}
      {error ? <p className="max-w-40 text-right text-xs text-destructive">{error}</p> : null}

      <FoodRenameProposalDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentName={food.name}
        isPending={proposeRename.isPending}
        onConfirm={async (proposedName) => {
          setError(null)
          setMessage(null)
          await proposeRename.mutateAsync({ foodId: food.id, proposedName })
          setMessage('Proposition envoyée pour validation.')
        }}
      />

      <FoodPortionTypeDialog
        open={portionDialogOpen}
        onOpenChange={setPortionDialogOpen}
        isPending={addPortionType.isPending}
        onConfirm={async ({ portionName, portionSizeG }) => {
          setError(null)
          setMessage(null)
          await addPortionType.mutateAsync({
            foodId: food.id,
            portionName,
            portionSizeG,
          })
          setMessage(`Portion « ${portionName} » (${formatNutrient(portionSizeG)} g) ajoutée.`)
        }}
      />
    </div>
  )
}

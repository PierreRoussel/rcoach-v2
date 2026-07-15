import { Check, Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type QuickAddRowStatus = 'adding' | 'success'

type QuickAddIconButtonProps = {
  itemName: string
  rowStatus: QuickAddRowStatus | null
  onQuickAdd: () => void
}

export function QuickAddIconButton({
  itemName,
  rowStatus,
  onQuickAdd,
}: QuickAddIconButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        'size-8 shrink-0 rounded-full border-primary text-primary transition-colors hover:bg-soft-primary hover:text-soft-primary-fg',
        rowStatus === 'success' && 'bg-soft-primary text-soft-primary-fg',
      )}
      disabled={rowStatus === 'adding' || rowStatus === 'success'}
      onClick={onQuickAdd}
      aria-label={
        rowStatus === 'success' ? `${itemName} ajouté` : `Ajouter ${itemName}`
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

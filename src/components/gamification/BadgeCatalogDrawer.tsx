import { BadgeShelf } from '@/components/gamification/BadgeShelf'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer'
import type { BadgeShelfItem } from '@/hooks/useBadges'

type BadgeCatalogDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: BadgeShelfItem[]
}

export function BadgeCatalogDrawer({ open, onOpenChange, items }: BadgeCatalogDrawerProps) {
  const unlockedCount = items.filter((item) => item.unlocked).length

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] rounded-t-[28px] border-t-0 bg-muted">
        <DrawerTitle className="sr-only">Catalogue de médailles</DrawerTitle>
        <DrawerDescription className="sr-only">
          Toutes les médailles disponibles et leur statut de déblocage.
        </DrawerDescription>

        <div className="overflow-y-auto px-4 pb-8 pt-2">
          <BadgeShelf
            items={items}
            title="Toutes les médailles"
            description="Accomplissements discipline, records et volume."
            embedded
            compact
            emptyMessage="Aucune médaille dans le catalogue."
          />
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {unlockedCount}/{items.length} débloquée(s)
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

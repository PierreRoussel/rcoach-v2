import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  DEFAULT_RPE_VALUE,
  formatRpeDisplay,
  isRpeValue,
  RPE_VALUES,
  type RpeValue,
} from '@/lib/workout/rpe-values'
import { cn } from '@/lib/utils'

type RpeDrawerProps = {
  open: boolean
  value?: number | null
  exerciseName?: string | null
  onOpenChange: (open: boolean) => void
  onSelect: (value: RpeValue) => void
}

export function RpeDrawer({
  open,
  value,
  exerciseName,
  onOpenChange,
  onSelect,
}: RpeDrawerProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const selectedValue = isRpeValue(value) ? value : null
  const focusedValue = selectedValue ?? DEFAULT_RPE_VALUE

  useEffect(() => {
    if (!open) {
      return
    }

    const timer = window.setTimeout(() => {
      const selectedNode = listRef.current?.querySelector(
        `[data-rpe-value="${focusedValue}"]`,
      )

      selectedNode?.scrollIntoView({ block: 'center' })
    }, 120)

    return () => window.clearTimeout(timer)
  }, [focusedValue, open])

  function handleSelect(rpe: RpeValue) {
    onSelect(rpe)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[75vh] rounded-t-3xl px-0">
        <DrawerHeader className="px-4 text-left">
          <DrawerTitle className="font-display font-black">RPE de la séance</DrawerTitle>
          <DrawerDescription>
            {exerciseName
              ? `Comment était ${exerciseName} ? Choisissez un RPE entre 6 et 10.`
              : 'Choisissez un RPE entre 6 et 10 (par pas de 0,5).'}
          </DrawerDescription>
        </DrawerHeader>

        <div
          ref={listRef}
          className="max-h-[min(52vh,28rem)] snap-y snap-mandatory overflow-y-auto scroll-smooth px-4 pb-6 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="space-y-1 pb-[40vh] pt-[40vh]">
            {RPE_VALUES.map((rpe) => {
              const isSelected = rpe === focusedValue

              return (
                <button
                  key={rpe}
                  type="button"
                  data-rpe-value={rpe}
                  className={cn(
                    'flex w-full snap-center items-center justify-center rounded-2xl py-3 font-display text-2xl font-black tabular-nums transition-colors',
                    isSelected
                      ? 'bg-soft-primary text-soft-primary-fg'
                      : 'text-foreground hover:bg-muted/50',
                  )}
                  onClick={() => handleSelect(rpe)}
                >
                  {formatRpeDisplay(rpe)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-t border-border px-4 py-3">
          <Button
            type="button"
            variant="soft"
            className="w-full rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Passer
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Ruler } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { FormMessage } from '@/components/ui/form'
import { useUpdateWaistMeasurement } from '@/hooks/useUpdateWaistMeasurement'
import {
  buildWaistCmOptions,
  formatWaistCmWithUnit,
  nearestWaistOption,
} from '@/lib/measurements/waist'
import { cn } from '@/lib/utils'

type WaistAdjustDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentWaistCm: number | null
}

export function WaistAdjustDrawer({
  open,
  onOpenChange,
  currentWaistCm,
}: WaistAdjustDrawerProps) {
  const options = useMemo(() => buildWaistCmOptions(), [])
  const { updateWaist, isPending, error, setError } = useUpdateWaistMeasurement()
  const listRef = useRef<HTMLDivElement>(null)
  const listPaddingRef = useRef(0)
  const initialWaistCm = nearestWaistOption(currentWaistCm ?? 80, options)
  const [selectedCm, setSelectedCm] = useState(initialWaistCm)

  const prepareListLayout = useCallback(() => {
    const container = listRef.current
    if (!container || container.children.length === 0) {
      return false
    }

    const itemHeight = (container.children[0] as HTMLElement).offsetHeight
    const pad = Math.max(0, container.clientHeight / 2 - itemHeight / 2)
    listPaddingRef.current = pad
    container.style.paddingTop = `${pad}px`
    container.style.paddingBottom = `${pad}px`
    return true
  }, [])

  const scrollToValue = useCallback(
    (value: number) => {
      const container = listRef.current
      if (!container) {
        return
      }

      const index = options.indexOf(value)
      if (index < 0) {
        return
      }

      const item = container.children[index] as HTMLElement | undefined
      if (!item) {
        return
      }

      if (listPaddingRef.current === 0) {
        prepareListLayout()
      }

      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight)
      const target = item.offsetTop - listPaddingRef.current
      container.scrollTop = Math.min(maxScroll, Math.max(0, target))
    },
    [options, prepareListLayout],
  )

  useLayoutEffect(() => {
    if (!open) {
      listPaddingRef.current = 0
      if (listRef.current) {
        listRef.current.style.paddingTop = ''
        listRef.current.style.paddingBottom = ''
      }
      return
    }

    setError(null)
    const nextValue = nearestWaistOption(currentWaistCm ?? 80, options)
    setSelectedCm(nextValue)

    const scroll = () => {
      if (!prepareListLayout()) {
        return
      }

      scrollToValue(nextValue)
    }

    scroll()

    const frame = window.requestAnimationFrame(scroll)

    return () => window.cancelAnimationFrame(frame)
  }, [currentWaistCm, open, options, prepareListLayout, scrollToValue, setError])

  function handleSelect(option: number) {
    setSelectedCm(option)
    scrollToValue(option)
  }

  async function handleSave() {
    const saved = await updateWaist(selectedCm)

    if (saved) {
      onOpenChange(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] rounded-t-2xl">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display font-black">Tour de taille</DrawerTitle>
          <DrawerDescription>
            Sélectionnez votre mensuration actuelle (précision 0,5 cm).
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4">
          <p className="text-center font-display text-3xl font-black tabular-nums text-foreground">
            {formatWaistCmWithUnit(selectedCm)}
          </p>

          <div
            ref={listRef}
            className="mt-4 h-56 overflow-y-auto rounded-2xl border border-border/70 bg-muted/20"
            role="listbox"
            aria-label="Tour de taille en centimètres"
          >
            {options.map((option) => {
              const isSelected = option === selectedCm

              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'flex h-12 w-full items-center justify-center rounded-xl px-4 font-display text-lg font-bold tabular-nums transition-colors',
                    isSelected
                      ? 'bg-soft-primary text-primary'
                      : 'text-foreground hover:bg-muted/60',
                  )}
                  onClick={() => handleSelect(option)}
                >
                  {formatWaistCmWithUnit(option)}
                </button>
              )
            })}
          </div>

          {error ? <FormMessage className="mt-3">{error}</FormMessage> : null}
        </div>

        <DrawerFooter className="px-4 pb-6">
          <Button
            type="button"
            className="rounded-full"
            disabled={isPending}
            onClick={() => void handleSave()}
          >
            Enregistrer
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

type WaistAdjustTileProps = {
  waistCm: number
  disabled?: boolean
  className?: string
}

export function WaistAdjustTile({
  waistCm,
  disabled = false,
  className,
}: WaistAdjustTileProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-soft-purple/30 bg-gradient-to-br from-soft-purple/70 via-card to-soft-purple/20 p-4 shadow-sm',
          className,
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-soft-purple/20 to-transparent"
          aria-hidden
        />

        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tour de taille</p>
            <p className="mt-2 font-display text-3xl font-black tabular-nums text-foreground">
              {formatWaistCmWithUnit(waistCm)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-soft-purple text-foreground">
              <Ruler className="size-4" aria-hidden />
            </div>
            <Button
              type="button"
              variant="soft"
              size="sm"
              className="rounded-full"
              disabled={disabled}
              onClick={() => setDrawerOpen(true)}
            >
              Modifier
            </Button>
          </div>
        </div>
      </div>

      <WaistAdjustDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        currentWaistCm={waistCm}
      />
    </>
  )
}

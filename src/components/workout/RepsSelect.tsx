import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'

const DEFAULT_REP_VALUES = Array.from({ length: 50 }, (_, index) => index + 1)

type RepsSelectProps = {
  value: number | null | undefined
  disabled?: boolean
  variant?: 'default' | 'inline'
  onChange: (value: number) => void
}

function buildRepOptions(value: number | null | undefined) {
  if (value == null || DEFAULT_REP_VALUES.includes(value)) {
    return DEFAULT_REP_VALUES
  }

  return [...DEFAULT_REP_VALUES, value].sort((left, right) => left - right)
}

function triggerClassName(variant: 'default' | 'inline') {
  return cn(
    'inline-flex shrink-0 items-center justify-center font-data tabular-nums transition-colors',
    'disabled:pointer-events-none disabled:opacity-50',
    variant === 'inline'
      ? 'h-8 min-w-0 flex-1 basis-0 rounded-none border-0 bg-transparent px-1 text-sm text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-0'
      : 'h-9 min-w-0 flex-1 basis-0 rounded-md border border-input bg-input-background px-2 text-sm',
  )
}

export function RepsSelect({
  value,
  disabled = false,
  variant = 'default',
  onChange,
}: RepsSelectProps) {
  const [open, setOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const options = buildRepOptions(value)
  const isInline = variant === 'inline'

  useEffect(() => {
    if (!open) {
      return
    }

    const timer = window.setTimeout(() => {
      const targetValue = value ?? options[0]
      const selectedNode = listRef.current?.querySelector(
        `[data-rep-value="${targetValue}"]`,
      )

      selectedNode?.scrollIntoView({ block: 'center' })
    }, 120)

    return () => window.clearTimeout(timer)
  }, [open, options, value])

  function handleSelect(reps: number) {
    onChange(reps)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label="Choisir le nombre de répétitions"
        className={triggerClassName(variant)}
        onClick={() => setOpen(true)}
      >
        {value != null ? (
          value
        ) : (
          <span className={cn(isInline && 'text-muted-foreground/60')}>
            {isInline ? '—' : 'reps'}
          </span>
        )}
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[75vh] rounded-t-3xl px-0">
          <DrawerHeader className="px-4 text-left">
            <DrawerTitle className="font-display font-black">Répétitions</DrawerTitle>
            <DrawerDescription>
              Faites défiler et sélectionnez le nombre de reps.
            </DrawerDescription>
          </DrawerHeader>

          <div
            ref={listRef}
            className="max-h-[min(52vh,28rem)] snap-y snap-mandatory overflow-y-auto scroll-smooth px-4 pb-6 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="space-y-1 pb-[40vh] pt-[40vh]">
              {options.map((reps) => {
                const isSelected = value === reps

                return (
                  <button
                    key={reps}
                    type="button"
                    data-rep-value={reps}
                    className={cn(
                      'flex w-full snap-center items-center justify-center rounded-2xl py-3 font-display text-2xl font-black tabular-nums transition-colors',
                      isSelected
                        ? 'bg-soft-primary text-primary'
                        : 'text-foreground hover:bg-muted/50',
                    )}
                    onClick={() => handleSelect(reps)}
                  >
                    {reps}
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
              onClick={() => setOpen(false)}
            >
              Fermer
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

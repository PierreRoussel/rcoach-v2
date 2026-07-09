import { Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type QuantityStepperProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  min?: number
  step?: number
  inputMode?: 'decimal' | 'numeric'
  className?: string
  decrementLabel?: string
  incrementLabel?: string
}

function parseQuantity(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function QuantityStepper({
  id,
  value,
  onChange,
  min = 0,
  step = 1,
  inputMode = 'decimal',
  className,
  decrementLabel = 'Diminuer la quantité',
  incrementLabel = 'Augmenter la quantité',
}: QuantityStepperProps) {
  const numericValue = parseQuantity(value)

  function adjust(delta: number) {
    const next = Math.max(min, numericValue + delta)
    onChange(String(next))
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-10 shrink-0 rounded-full"
        disabled={numericValue <= min}
        onClick={() => adjust(-step)}
        aria-label={decrementLabel}
      >
        <Minus className="size-4" />
      </Button>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        className="h-10 text-center font-data font-semibold tabular-nums"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-10 shrink-0 rounded-full"
        onClick={() => adjust(step)}
        aria-label={incrementLabel}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  )
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  formatRpeDisplay,
  isRpeValue,
  RPE_VALUES,
  type RpeValue,
} from '@/lib/workout/rpe-values'
import { cn } from '@/lib/utils'

export { RPE_VALUES, type RpeValue } from '@/lib/workout/rpe-values'

type RpeSelectProps = {
  value: number | null | undefined
  disabled?: boolean
  variant?: 'default' | 'inline'
  onChange: (value: RpeValue) => void
}

export function RpeSelect({
  value,
  disabled,
  variant = 'default',
  onChange,
}: RpeSelectProps) {
  const selectedValue = isRpeValue(value) ? String(value) : undefined
  const isInline = variant === 'inline'

  return (
    <Select
      value={selectedValue}
      disabled={disabled}
      onValueChange={(next) => onChange(Number(next) as RpeValue)}
    >
      <SelectTrigger
        size="sm"
        className={cn(
          'shrink-0 justify-center font-data tabular-nums [&>svg]:hidden',
          isInline
            ? 'h-8 w-[2.75rem] border-0 bg-transparent px-1 text-sm shadow-none focus-visible:border-b focus-visible:border-primary focus-visible:ring-0 rounded-none data-[placeholder]:text-muted-foreground/60'
            : 'h-9 w-[3.25rem] px-1',
        )}
        aria-label="RPE"
      >
        <SelectValue placeholder={isInline ? '—' : 'RPE'} />
      </SelectTrigger>
      <SelectContent>
        {RPE_VALUES.map((rpe) => (
          <SelectItem key={rpe} value={String(rpe)}>
            {formatRpeDisplay(rpe)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

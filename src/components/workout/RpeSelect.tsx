import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const RPE_VALUES = [6, 7, 8, 9, 10] as const

export type RpeValue = (typeof RPE_VALUES)[number]

type RpeSelectProps = {
  value: number | null | undefined
  disabled?: boolean
  onChange: (value: RpeValue) => void
}

function isRpeValue(value: number | null | undefined): value is RpeValue {
  return value != null && RPE_VALUES.includes(value as RpeValue)
}

export function RpeSelect({ value, disabled, onChange }: RpeSelectProps) {
  const selectedValue = isRpeValue(value) ? String(value) : undefined

  return (
    <Select
      value={selectedValue}
      disabled={disabled}
      onValueChange={(next) => onChange(Number(next) as RpeValue)}
    >
      <SelectTrigger
        size="sm"
        className="h-9 w-[3.25rem] shrink-0 justify-center px-1 font-data [&>svg]:hidden"
        aria-label="RPE"
      >
        <SelectValue placeholder="RPE" />
      </SelectTrigger>
      <SelectContent>
        {RPE_VALUES.map((rpe) => (
          <SelectItem key={rpe} value={String(rpe)}>
            {rpe}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

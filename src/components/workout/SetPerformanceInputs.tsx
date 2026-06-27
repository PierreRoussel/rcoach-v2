import { Input } from '@/components/ui/input'
import { RepsSelect } from '@/components/workout/RepsSelect'
import { cn } from '@/lib/utils'
import {
  formatDurationInput,
  parseDurationInput,
} from '@/lib/workout/parse-duration-input'
import type { ExerciseKind } from '@/lib/workout/progressive-overload'

export type SetPerformanceValues = {
  weightKg?: number | null
  reps?: number | null
  durationSeconds?: number | null
}

type SetPerformanceInputsProps = {
  kind: ExerciseKind
  values: SetPerformanceValues
  disabled?: boolean
  variant?: 'default' | 'inline'
  onChange: (patch: Partial<SetPerformanceValues>) => void
  onFieldFocus?: (field: keyof SetPerformanceValues) => void
  onFieldBlur?: (field: keyof SetPerformanceValues, value: number | null) => void
  className?: string
}

const inlineFieldClass =
  'h-8 min-w-0 flex-1 basis-0 rounded-none border-0 bg-transparent px-1 text-center text-sm font-data tabular-nums shadow-none placeholder:text-muted-foreground/60 focus-visible:border-b focus-visible:border-primary focus-visible:ring-0 disabled:opacity-70'

const defaultFieldClass =
  'h-9 min-w-0 flex-1 basis-0 px-2 text-center text-sm font-data'

function fieldClass(variant: 'default' | 'inline', className?: string) {
  return cn(variant === 'inline' ? inlineFieldClass : defaultFieldClass, className)
}

export function getSetPerformanceColumnLabels(kind: ExerciseKind): string[] {
  switch (kind) {
    case 'bodyweight':
    case 'band':
      return ['reps']
    case 'timed':
      return ['durée (s)']
    case 'cardio':
      return ['durée (s)']
    default:
      return ['kg', 'reps']
  }
}

export function SetPerformanceInputs({
  kind,
  values,
  disabled = false,
  variant = 'default',
  onChange,
  onFieldFocus,
  onFieldBlur,
  className,
}: SetPerformanceInputsProps) {
  const isInline = variant === 'inline'

  if (kind === 'timed' || kind === 'cardio') {
    return (
      <Input
        inputMode="numeric"
        placeholder="30"
        value={formatDurationInput(values.durationSeconds)}
        disabled={disabled}
        className={fieldClass(variant, className)}
        onFocus={() => onFieldFocus?.('durationSeconds')}
        onChange={(event) => {
          const parsed = parseDurationInput(event.target.value)
          onChange({ durationSeconds: parsed })
        }}
        onBlur={(event) => {
          const parsed = parseDurationInput(event.target.value)
          if (parsed != null) {
            onChange({ durationSeconds: parsed })
          }
          onFieldBlur?.('durationSeconds', parsed)
        }}
      />
    )
  }

  if (kind === 'bodyweight' || kind === 'band') {
    return (
      <RepsSelect
        value={values.reps}
        disabled={disabled}
        variant={variant}
        onChange={(reps) => onChange({ reps })}
      />
    )
  }

  const fields = (
    <>
      <Input
        inputMode="decimal"
        placeholder={isInline ? '—' : 'kg'}
        value={values.weightKg ?? ''}
        disabled={disabled}
        className={fieldClass(variant, className)}
        onFocus={() => onFieldFocus?.('weightKg')}
        onChange={(event) =>
          onChange({
            weightKg: event.target.value ? Number(event.target.value) : null,
          })
        }
        onBlur={(event) =>
          onFieldBlur?.(
            'weightKg',
            event.target.value ? Number(event.target.value) : null,
          )
        }
      />
      <RepsSelect
        value={values.reps}
        disabled={disabled}
        variant={variant}
        onChange={(reps) => onChange({ reps })}
      />
    </>
  )

  if (!isInline) {
    return fields
  }

  return (
    <div className="flex min-w-0 flex-1 items-center divide-x divide-border/50">
      {fields}
    </div>
  )
}

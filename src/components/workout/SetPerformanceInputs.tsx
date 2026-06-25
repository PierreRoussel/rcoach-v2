import { Input } from '@/components/ui/input'
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
  onChange: (patch: Partial<SetPerformanceValues>) => void
  onFieldFocus?: (field: keyof SetPerformanceValues) => void
  onFieldBlur?: (field: keyof SetPerformanceValues, value: number | null) => void
  className?: string
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
  onChange,
  onFieldFocus,
  onFieldBlur,
  className,
}: SetPerformanceInputsProps) {
  if (kind === 'timed' || kind === 'cardio') {
    return (
      <Input
        inputMode="numeric"
        placeholder="30"
        value={formatDurationInput(values.durationSeconds)}
        disabled={disabled}
        className={cn(
          'h-9 min-w-0 flex-1 basis-0 px-2 text-center text-sm font-data',
          className,
        )}
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
      <Input
        inputMode="numeric"
        placeholder="reps"
        value={values.reps ?? ''}
        disabled={disabled}
        className={cn(
          'h-9 min-w-0 flex-1 basis-0 px-2 text-center text-sm font-data',
          className,
        )}
        onFocus={() => onFieldFocus?.('reps')}
        onChange={(event) =>
          onChange({
            reps: event.target.value ? Number(event.target.value) : null,
          })
        }
        onBlur={(event) =>
          onFieldBlur?.(
            'reps',
            event.target.value ? Number(event.target.value) : null,
          )
        }
      />
    )
  }

  return (
    <>
      <Input
        inputMode="decimal"
        placeholder="kg"
        value={values.weightKg ?? ''}
        disabled={disabled}
        className={cn(
          'h-9 min-w-0 flex-1 basis-0 px-2 text-center text-sm font-data',
          className,
        )}
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
      <Input
        inputMode="numeric"
        placeholder="reps"
        value={values.reps ?? ''}
        disabled={disabled}
        className={cn(
          'h-9 min-w-0 flex-1 basis-0 px-2 text-center text-sm font-data',
          className,
        )}
        onFocus={() => onFieldFocus?.('reps')}
        onChange={(event) =>
          onChange({
            reps: event.target.value ? Number(event.target.value) : null,
          })
        }
        onBlur={(event) =>
          onFieldBlur?.(
            'reps',
            event.target.value ? Number(event.target.value) : null,
          )
        }
      />
    </>
  )
}

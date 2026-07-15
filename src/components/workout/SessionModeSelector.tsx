import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Label } from '@/components/ui/label'
import type { SessionMode } from '@/lib/workout/session-mode'

type SessionModeSelectorProps = {
  value: SessionMode
  onChange: (value: SessionMode) => void
  disabled?: boolean
}

export function SessionModeSelector({
  value,
  onChange,
  disabled = false,
}: SessionModeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Type de séance</Label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => {
          if (next === 'circuit' || next === 'emom') {
            onChange(next)
          }
        }}
        disabled={disabled}
        className="grid w-full grid-cols-2 gap-2"
      >
        <ToggleGroupItem value="circuit" className="rounded-xl">
          Circuit
        </ToggleGroupItem>
        <ToggleGroupItem value="emom" className="rounded-xl">
          EMOM
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

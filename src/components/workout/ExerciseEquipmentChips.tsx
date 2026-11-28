import { Pill } from '@/design-system'
import { formatEquipmentLabel } from '@/lib/workout/exercise-labels'
import { cn } from '@/lib/utils'

type ExerciseEquipmentChipsProps = {
  options: string[]
  selectedEquipment?: string | null
  onSelect: (equipment: string) => void
  className?: string
}

export function ExerciseEquipmentChips({
  options,
  selectedEquipment = null,
  onSelect,
  className,
}: ExerciseEquipmentChipsProps) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {options.map((option) => {
        const label = formatEquipmentLabel(option) ?? 'Autre'
        const selected = option === selectedEquipment
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={selected ? 'opacity-100' : 'opacity-80'}
          >
            <Pill tone={selected ? 'primary' : 'default'}>{label}</Pill>
          </button>
        )
      })}
    </div>
  )
}

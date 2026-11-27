import { Pill } from '@/design-system'
import type { Exercise } from '@/lib/graphql/operations'
import { formatEquipmentLabel } from '@/lib/workout/exercise-labels'
import { cn } from '@/lib/utils'

type ExerciseEquipmentChipsProps = {
  variants: Exercise[]
  selectedId?: string | null
  onSelect: (exercise: Exercise) => void
  className?: string
}

export function ExerciseEquipmentChips({
  variants,
  selectedId = null,
  onSelect,
  className,
}: ExerciseEquipmentChipsProps) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {variants.map((variant) => {
        const label = formatEquipmentLabel(variant.equipment) ?? 'Autre'
        const selected = variant.id === selectedId
        return (
          <button
            key={variant.id}
            type="button"
            onClick={() => onSelect(variant)}
            className={selected ? 'opacity-100' : 'opacity-80'}
          >
            <Pill tone={selected ? 'primary' : 'default'}>{label}</Pill>
          </button>
        )
      })}
    </div>
  )
}

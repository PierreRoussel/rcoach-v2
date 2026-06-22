import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

import { restorePointerInteraction } from '@/lib/ui/restore-pointer-interaction'

const POINTER_ACTIVATION = { distance: 8 }
const TOUCH_ACTIVATION = { delay: 200, tolerance: 8 }

export function useSortableSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: POINTER_ACTIVATION }),
    useSensor(TouchSensor, { activationConstraint: TOUCH_ACTIVATION }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
}

export function prepareForSortableDrag() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

export function wrapSortableDragEnd(
  handler: (event: DragEndEvent) => void,
): (event: DragEndEvent) => void {
  return (event) => {
    try {
      handler(event)
    } finally {
      restorePointerInteraction()
    }
  }
}

export { restorePointerInteraction }

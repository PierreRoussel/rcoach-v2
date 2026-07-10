import { useCallback, useRef, useState, type PointerEvent } from 'react'

import {
  HORIZONTAL_SWIPE_DIRECTION_LOCK_PX,
  HORIZONTAL_SWIPE_THRESHOLD_PX,
  resolveHorizontalSwipe,
} from '@/lib/ui/horizontal-swipe'

const HORIZONTAL_SWIPE_DRAG_DAMPING = 0.65
const HORIZONTAL_SWIPE_MAX_DRAG_PX = 120

type UseHorizontalSwipeOptions = {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  disabled?: boolean
}

function clampDragOffset(offset: number) {
  return Math.max(
    -HORIZONTAL_SWIPE_MAX_DRAG_PX,
    Math.min(HORIZONTAL_SWIPE_MAX_DRAG_PX, offset),
  )
}

export function useHorizontalSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = HORIZONTAL_SWIPE_THRESHOLD_PX,
  disabled = false,
}: UseHorizontalSwipeOptions) {
  const originRef = useRef<{ x: number; y: number } | null>(null)
  const lockedRef = useRef<'horizontal' | 'vertical' | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false)

  const reset = useCallback(() => {
    originRef.current = null
    lockedRef.current = null
    setIsDraggingHorizontal(false)
    setDragOffset(0)
  }, [])

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (disabled || event.button !== 0) {
        return
      }

      originRef.current = { x: event.clientX, y: event.clientY }
      lockedRef.current = null
      setIsDraggingHorizontal(false)
      setDragOffset(0)
    },
    [disabled],
  )

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!originRef.current || disabled) {
        return
      }

      const deltaX = event.clientX - originRef.current.x
      const deltaY = event.clientY - originRef.current.y

      if (!lockedRef.current) {
        if (
          Math.abs(deltaX) < HORIZONTAL_SWIPE_DIRECTION_LOCK_PX &&
          Math.abs(deltaY) < HORIZONTAL_SWIPE_DIRECTION_LOCK_PX
        ) {
          return
        }

        lockedRef.current =
          Math.abs(deltaX) >= Math.abs(deltaY) ? 'horizontal' : 'vertical'
      }

      if (lockedRef.current !== 'horizontal') {
        return
      }

      setIsDraggingHorizontal(true)
      setDragOffset(clampDragOffset(deltaX * HORIZONTAL_SWIPE_DRAG_DAMPING))
    },
    [disabled],
  )

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      if (!originRef.current || disabled) {
        reset()
        return
      }

      if (lockedRef.current === 'vertical') {
        reset()
        return
      }

      const deltaX = event.clientX - originRef.current.x
      const deltaY = event.clientY - originRef.current.y
      const direction = resolveHorizontalSwipe(deltaX, deltaY, threshold)

      if (direction === 'left') {
        onSwipeLeft?.()
      } else if (direction === 'right') {
        onSwipeRight?.()
      }

      reset()
    },
    [disabled, onSwipeLeft, onSwipeRight, reset, threshold],
  )

  return {
    dragOffset,
    isDraggingHorizontal,
    swipeProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: reset,
      style: { touchAction: 'pan-y' as const },
    },
  }
}

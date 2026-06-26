import { useRef, useState, type ReactNode } from 'react'

import {
  resolveFullSwipeOffset,
  shouldTriggerFullSwipeDelete,
  SWIPE_DIRECTION_LOCK_PX,
} from '@/lib/ui/swipe-delete'
import { cn } from '@/lib/utils'

type SwipeToDeleteRowProps = {
  children: ReactNode
  onDelete: () => void
  disabled?: boolean
  className?: string
}

type DragAxis = 'horizontal' | 'vertical' | null

export function SwipeToDeleteRow({
  children,
  onDelete,
  disabled = false,
  className,
}: SwipeToDeleteRowProps) {
  const [offset, setOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const startOffset = useRef(0)
  const rowWidth = useRef(0)
  const axis = useRef<DragAxis>(null)
  const swiped = useRef(false)
  const activePointerId = useRef<number | null>(null)
  const hasCapture = useRef(false)

  function measureRowWidth() {
    rowWidth.current = containerRef.current?.offsetWidth ?? 0
  }

  function releaseCaptureSafely(event: React.PointerEvent<HTMLDivElement>) {
    if (!hasCapture.current) {
      return
    }

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    } catch {
      // Pointer may already be released by the browser.
    } finally {
      hasCapture.current = false
    }
  }

  function resetDrag() {
    axis.current = null
    activePointerId.current = null
    hasCapture.current = false
    swiped.current = false
    setIsAnimating(false)
    setOffset(0)
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) {
      return
    }

    measureRowWidth()
    activePointerId.current = event.pointerId
    startX.current = event.clientX
    startY.current = event.clientY
    startOffset.current = offset
    axis.current = null
    swiped.current = false
    hasCapture.current = false
    setIsAnimating(false)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || activePointerId.current !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - startX.current
    const deltaY = event.clientY - startY.current

    if (!axis.current) {
      if (
        Math.abs(deltaX) < SWIPE_DIRECTION_LOCK_PX &&
        Math.abs(deltaY) < SWIPE_DIRECTION_LOCK_PX
      ) {
        return
      }

      axis.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
    }

    if (axis.current !== 'horizontal') {
      return
    }

    if (!hasCapture.current) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
        hasCapture.current = true
      } catch {
        hasCapture.current = false
      }
    }

    event.preventDefault()
    swiped.current = true
    setOffset(resolveFullSwipeOffset(startOffset.current, deltaX, rowWidth.current))
  }

  function finishSwipe(shouldDelete: boolean) {
    if (shouldDelete && rowWidth.current > 0) {
      setIsAnimating(true)
      setOffset(-rowWidth.current)
      window.setTimeout(() => {
        onDelete()
        resetDrag()
      }, 140)
      return
    }

    setIsAnimating(true)
    setOffset(0)
    window.setTimeout(() => {
      resetDrag()
    }, 160)
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (activePointerId.current !== event.pointerId) {
      return
    }

    releaseCaptureSafely(event)

    const shouldDelete =
      axis.current === 'horizontal' && shouldTriggerFullSwipeDelete(offset, rowWidth.current)

    activePointerId.current = null
    finishSwipe(shouldDelete)
  }

  function handleLostPointerCapture(event: React.PointerEvent<HTMLDivElement>) {
    if (activePointerId.current === event.pointerId) {
      hasCapture.current = false
    }
  }

  function handleClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (swiped.current) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  return (
    <div ref={containerRef} className={cn('overflow-hidden', className)}>
      <div
        className={cn(
          'relative bg-card touch-pan-y',
          isAnimating ? 'transition-transform duration-150 ease-out' : 'transition-none',
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handleLostPointerCapture}
        onClickCapture={handleClickCapture}
      >
        {children}
      </div>
    </div>
  )
}

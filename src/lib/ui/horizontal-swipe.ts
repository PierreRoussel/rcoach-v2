export const HORIZONTAL_SWIPE_THRESHOLD_PX = 48
export const HORIZONTAL_SWIPE_DIRECTION_LOCK_PX = 8

export type HorizontalSwipeDirection = 'left' | 'right'

export function resolveHorizontalSwipe(
  deltaX: number,
  deltaY: number,
  threshold = HORIZONTAL_SWIPE_THRESHOLD_PX,
): HorizontalSwipeDirection | null {
  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    return null
  }

  if (Math.abs(deltaX) < threshold) {
    return null
  }

  return deltaX < 0 ? 'left' : 'right'
}

export const SWIPE_DIRECTION_LOCK_PX = 8
export const SWIPE_DELETE_COMPLETE_RATIO = 0.7

export function clampFullSwipeOffset(offset: number, rowWidth: number) {
  if (rowWidth <= 0) {
    return Math.min(0, offset)
  }

  const minOffset = -rowWidth * 1.05
  return Math.min(0, Math.max(minOffset, offset))
}

export function resolveFullSwipeOffset(startOffset: number, deltaX: number, rowWidth: number) {
  return clampFullSwipeOffset(startOffset + deltaX, rowWidth)
}

export function shouldTriggerFullSwipeDelete(offset: number, rowWidth: number) {
  if (rowWidth <= 0) {
    return false
  }

  return -offset >= rowWidth * SWIPE_DELETE_COMPLETE_RATIO
}

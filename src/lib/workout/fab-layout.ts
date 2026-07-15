const SAFE_AREA_BOTTOM =
  'var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))'

/** Height of the sticky bottom nav (icons + labels + safe area). */
export const APP_BOTTOM_NAV_OFFSET = `calc(4.5rem + ${SAFE_AREA_BOTTOM})`

export const WORKOUT_FAB_BOTTOM_OFFSET = `calc(4.5rem + ${SAFE_AREA_BOTTOM} + 0.75rem)`

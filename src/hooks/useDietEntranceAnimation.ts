import { useEffect, useRef } from 'react'

const DIET_ENTRANCE_KEY = 'diet-page-entrance-played'

export function useDietEntranceAnimation() {
  const shouldAnimate = useRef(
    typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(DIET_ENTRANCE_KEY) !== '1',
  ).current

  useEffect(() => {
    sessionStorage.setItem(DIET_ENTRANCE_KEY, '1')
  }, [])

  return shouldAnimate
}

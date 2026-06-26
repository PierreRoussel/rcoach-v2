import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

const MEAL_PATH_PREFIX = '/app/diet/meals/'

export function isDietMealPath(pathname: string) {
  return pathname.startsWith(MEAL_PATH_PREFIX)
}

/** Browser back from a meal detail page always returns to the diet journal. */
export function useDietMealBackNavigation(date: string) {
  const navigate = useNavigate()
  const handlingBackRef = useRef(false)

  useEffect(() => {
    window.history.pushState({ __dietMealBack: true }, '')

    const onPopState = () => {
      if (handlingBackRef.current) {
        return
      }

      handlingBackRef.current = true
      void navigate({
        to: '/app/diet',
        search: { date },
        replace: true,
      }).finally(() => {
        handlingBackRef.current = false
      })
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [date, navigate])
}

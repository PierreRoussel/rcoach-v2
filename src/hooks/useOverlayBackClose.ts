import { useRouterState } from '@tanstack/react-router'
import { useCallback, useEffect, useId, useRef } from 'react'

type UseOverlayBackCloseOptions = {
  enabled?: boolean
}

export function useOverlayBackClose(
  open: boolean,
  onOpenChange: (open: boolean) => void,
  historyKey?: string,
  options: UseOverlayBackCloseOptions = {},
) {
  const { enabled = true } = options
  const generatedKey = useId()
  const resolvedHistoryKey = historyKey ?? `overlay-${generatedKey}`
  const historyPushedRef = useRef(false)
  const closingFromPopStateRef = useRef(false)
  const closingFromRouteChangeRef = useRef(false)
  const locationKey = useRouterState({
    select: (state) => state.location.href,
  })
  const locationKeyRef = useRef(locationKey)

  useEffect(() => {
    if (!enabled || !open) {
      return
    }

    window.history.pushState({ [resolvedHistoryKey]: true }, '')
    historyPushedRef.current = true

    const handlePopState = () => {
      closingFromPopStateRef.current = true
      historyPushedRef.current = false
      onOpenChange(false)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [enabled, onOpenChange, open, resolvedHistoryKey])

  useEffect(() => {
    if (!enabled || !open) {
      locationKeyRef.current = locationKey
      return
    }

    if (locationKeyRef.current === locationKey) {
      return
    }

    locationKeyRef.current = locationKey
    closingFromRouteChangeRef.current = true
    historyPushedRef.current = false
    onOpenChange(false)
  }, [enabled, locationKey, onOpenChange, open])

  return useCallback(
    (next: boolean) => {
      if (!enabled) {
        onOpenChange(next)
        return
      }

      if (open && !next) {
        if (closingFromPopStateRef.current || closingFromRouteChangeRef.current) {
          closingFromPopStateRef.current = false
          closingFromRouteChangeRef.current = false
          onOpenChange(false)
          return
        }

        onOpenChange(false)

        if (historyPushedRef.current) {
          historyPushedRef.current = false
          window.history.back()
        }

        return
      }

      onOpenChange(next)
    },
    [enabled, onOpenChange, open],
  )
}

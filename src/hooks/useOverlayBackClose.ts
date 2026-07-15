import { useRouterState } from '@tanstack/react-router'
import { useCallback, useEffect, useId, useRef } from 'react'

type UseOverlayBackCloseOptions = {
  enabled?: boolean
}

type OverlayStackEntry = {
  historyKey: string
  historyPushed: boolean
  closeFromBack: () => void
}

const overlayStack: OverlayStackEntry[] = []
let globalPopStateListenerAttached = false
let ignoreNextPopState = false

function pushOverlayHistoryEntry(historyKey: string) {
  window.history.pushState(
    { ...window.history.state, [historyKey]: true },
    '',
    window.location.href,
  )
}

function historyHasOverlayEntry(historyKey: string) {
  const state = window.history.state

  return (
    state != null &&
    typeof state === 'object' &&
    (state as Record<string, unknown>)[historyKey] === true
  )
}

function attachGlobalPopStateListener() {
  if (globalPopStateListenerAttached) {
    return
  }

  globalPopStateListenerAttached = true

  window.addEventListener('popstate', () => {
    if (ignoreNextPopState) {
      ignoreNextPopState = false
      return
    }

    const top = overlayStack[overlayStack.length - 1]
    if (!top?.historyPushed) {
      return
    }

    top.historyPushed = false
    top.closeFromBack()
  })
}

function registerOverlay(entry: OverlayStackEntry) {
  attachGlobalPopStateListener()
  overlayStack.push(entry)

  return () => {
    const index = overlayStack.indexOf(entry)
    if (index >= 0) {
      overlayStack.splice(index, 1)
    }
  }
}

function removeOverlayEntry(entry: OverlayStackEntry) {
  const index = overlayStack.indexOf(entry)
  if (index >= 0) {
    overlayStack.splice(index, 1)
  }
}

/** Pops the topmost history-backed overlay (e.g. Android hardware back). */
export function closeTopHistoryOverlay(): boolean {
  const top = overlayStack[overlayStack.length - 1]
  if (!top?.historyPushed) {
    return false
  }

  window.history.back()
  return true
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
  const entryRef = useRef<OverlayStackEntry | null>(null)
  const locationKey = useRouterState({
    select: (state) => state.location.href,
  })
  const locationKeyRef = useRef(locationKey)

  useEffect(() => {
    if (!enabled || !open) {
      return
    }

    pushOverlayHistoryEntry(resolvedHistoryKey)
    historyPushedRef.current = true

    const entry: OverlayStackEntry = {
      historyKey: resolvedHistoryKey,
      historyPushed: true,
      closeFromBack: () => {
        closingFromPopStateRef.current = true
        historyPushedRef.current = false
        onOpenChange(false)
      },
    }
    entryRef.current = entry

    const unregister = registerOverlay(entry)

    return () => {
      unregister()
      if (entryRef.current === entry) {
        entryRef.current = null
      }
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

    const entry = entryRef.current
    if (entry) {
      entry.historyPushed = false
      removeOverlayEntry(entry)
    }

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

        const entry = entryRef.current
        if (entry) {
          entry.historyPushed = false
          removeOverlayEntry(entry)
        }
        historyPushedRef.current = false

        if (historyHasOverlayEntry(resolvedHistoryKey)) {
          ignoreNextPopState = true
          window.history.back()
        }

        return
      }

      onOpenChange(next)
    },
    [enabled, onOpenChange, open, resolvedHistoryKey],
  )
}

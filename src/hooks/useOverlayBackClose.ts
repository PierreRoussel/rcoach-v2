import { useCallback, useEffect, useRef } from 'react'

export function useOverlayBackClose(
  open: boolean,
  onOpenChange: (open: boolean) => void,
  historyKey: string,
) {
  const historyPushedRef = useRef(false)
  const closingFromPopStateRef = useRef(false)

  useEffect(() => {
    if (!open) {
      return
    }

    window.history.pushState({ [historyKey]: true }, '')
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
  }, [historyKey, onOpenChange, open])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (open && !next) {
        if (closingFromPopStateRef.current) {
          closingFromPopStateRef.current = false
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
    [onOpenChange, open],
  )

  return handleOpenChange
}

import { useEffect, useRef } from 'react'

/**
 * Runs `callback` on a fixed interval only while the document is visible.
 * Pausing in background saves battery during long workout sessions (PWA / native).
 */
export function useIntervalWhenVisible(callback: () => void, delayMs: number | null) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (delayMs == null || delayMs <= 0) {
      return
    }

    let timerId: ReturnType<typeof setInterval> | undefined

    const stop = () => {
      if (timerId != null) {
        clearInterval(timerId)
        timerId = undefined
      }
    }

    const start = () => {
      stop()
      callbackRef.current()
      timerId = setInterval(() => {
        callbackRef.current()
      }, delayMs)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        start()
        return
      }

      stop()
    }

    if (document.visibilityState === 'visible') {
      start()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [delayMs])
}

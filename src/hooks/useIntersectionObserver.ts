import { useEffect, useRef, useState } from 'react'

type UseIntersectionObserverOptions = {
  rootMargin?: string
  enabled?: boolean
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {},
) {
  const { rootMargin = '200px', enabled = true } = options
  const targetRef = useRef<HTMLDivElement | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const target = targetRef.current
    if (!target || !enabled) {
      setIsIntersecting(false)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry?.isIntersecting ?? false)
      },
      { rootMargin },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return { targetRef, isIntersecting }
}

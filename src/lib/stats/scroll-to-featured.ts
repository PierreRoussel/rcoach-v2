const STATS_SCROLL_FEATURED_KEY = 'rcoach:stats-scroll-featured'

export function markStatsScrollToFeatured() {
  sessionStorage.setItem(STATS_SCROLL_FEATURED_KEY, '1')
}

export function consumeStatsScrollToFeatured(): boolean {
  if (sessionStorage.getItem(STATS_SCROLL_FEATURED_KEY) !== '1') {
    return false
  }

  sessionStorage.removeItem(STATS_SCROLL_FEATURED_KEY)
  return true
}

export function scrollElementIntoViewWhenReady(
  getElement: () => HTMLElement | null,
  options?: {
    maxAttempts?: number
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
    onScroll?: () => void
  },
) {
  const maxAttempts = options?.maxAttempts ?? 20
  let attempts = 0
  let cancelled = false

  function tryScroll() {
    if (cancelled) {
      return
    }

    const element = getElement()
    if (!element) {
      if (attempts < maxAttempts) {
        attempts += 1
        window.requestAnimationFrame(tryScroll)
      }
      return
    }

    element.scrollIntoView({
      behavior: options?.behavior ?? 'smooth',
      block: options?.block ?? 'start',
    })
    options?.onScroll?.()
  }

  const startTimer = window.setTimeout(() => {
    window.requestAnimationFrame(tryScroll)
  }, 120)

  return () => {
    cancelled = true
    window.clearTimeout(startTimer)
  }
}

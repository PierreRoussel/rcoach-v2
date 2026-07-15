/**
 * Suppresses benign "Skipped ViewTransition" rejections when TanStack Router
 * starts overlapping transitions (e.g. dialog close + programmatic navigate).
 */
export function installViewTransitionErrorGuard() {
  if (typeof document === 'undefined' || !('startViewTransition' in document)) {
    return
  }

  const nativeStartViewTransition = document.startViewTransition.bind(document)

  document.startViewTransition = function patchedStartViewTransition(
    ...args: Parameters<Document['startViewTransition']>
  ) {
    const transition = nativeStartViewTransition(...args)

    void transition?.finished?.catch(() => {
      // Another transition was already running — navigation still commits via the first one.
    })

    return transition
  }
}

/** Radix dialog exit animation — wait before navigating to avoid overlapping transitions. */
export const DIALOG_CLOSE_MS = 200

export function waitForDialogClose(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, DIALOG_CLOSE_MS)
  })
}

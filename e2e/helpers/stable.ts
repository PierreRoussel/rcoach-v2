import type { Page } from '@playwright/test'

/** Wait for network quiet + disable CSS animations for stable screenshots. */
export async function prepareStablePage(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  })
  await page.waitForLoadState('networkidle').catch(() => undefined)
  await page.waitForTimeout(150)
}

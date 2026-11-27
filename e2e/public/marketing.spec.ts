import { test, expect } from '@playwright/test'

import { prepareStablePage } from '../helpers/stable'

test.describe('marketing landing', () => {
  test('home visual', async ({ page }) => {
    await page.goto('/')
    await prepareStablePage(page)
    await expect(page).toHaveScreenshot('marketing-home.png', {
      fullPage: true,
    })
  })
})

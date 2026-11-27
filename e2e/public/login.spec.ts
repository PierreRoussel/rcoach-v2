import { test, expect } from '@playwright/test'

import { prepareStablePage } from '../helpers/stable'

test.describe('auth login', () => {
  test('login visual', async ({ page }) => {
    await page.goto('/auth/login')
    await prepareStablePage(page)
    await expect(page).toHaveScreenshot('auth-login.png', {
      fullPage: true,
    })
  })
})

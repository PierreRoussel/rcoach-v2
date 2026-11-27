import { test, expect } from '@playwright/test'

import { loginWithLocalAccount, readLocalTestAccount } from '../helpers/auth'
import { prepareStablePage } from '../helpers/stable'

const account = readLocalTestAccount()

test.describe('athlete smoke', () => {
  test.skip(!account, 'Pas de .local/test-account.md — skip smoke auth')

  test('post-login /app visual', async ({ page }) => {
    await loginWithLocalAccount(page, account!)
    await prepareStablePage(page)
    await expect(page).toHaveScreenshot('athlete-app-home.png', {
      fullPage: true,
    })
  })
})

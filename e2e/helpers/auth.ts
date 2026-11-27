import fs from 'node:fs'
import path from 'node:path'

import type { Page } from '@playwright/test'

export type LocalTestAccount = {
  email: string
  password: string
}

const ACCOUNT_RELATIVE = path.join('.local', 'test-account.md')

/** Parse `.local/test-account.md` (table Email / Mot de passe). Returns null if missing. */
export function readLocalTestAccount(
  cwd = process.cwd(),
): LocalTestAccount | null {
  const filePath = path.join(cwd, ACCOUNT_RELATIVE)
  if (!fs.existsSync(filePath)) return null

  const text = fs.readFileSync(filePath, 'utf8')
  const email =
    matchTableCell(text, /Email\s*\|\s*`?([^`|\n]+)`?/i) ??
    matchLabeled(text, /Email\s*[:=]\s*`?([^\s`|]+)`?/i)
  const password =
    matchTableCell(text, /Mot de passe\s*\|\s*`?([^`|\n]+)`?/i) ??
    matchLabeled(text, /(?:Mot de passe|Password)\s*[:=]\s*`?([^\s`|]+)`?/i)

  if (!email || !password) return null
  return { email: email.trim(), password: password.trim() }
}

function matchTableCell(text: string, re: RegExp): string | null {
  const m = text.match(re)
  return m?.[1]?.trim() ? m[1].trim() : null
}

function matchLabeled(text: string, re: RegExp): string | null {
  const m = text.match(re)
  return m?.[1]?.trim() ? m[1].trim() : null
}

export async function loginWithLocalAccount(
  page: Page,
  account: LocalTestAccount,
): Promise<void> {
  await page.goto('/auth/login')
  await page.locator('#email').fill(account.email)
  await page.locator('#password').fill(account.password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL(/\/app(\/|$)/, { timeout: 45_000 })
}

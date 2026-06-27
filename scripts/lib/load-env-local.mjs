import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function parseEnvValue(raw) {
  const trimmed = raw.trim()
  if (!trimmed) {
    return ''
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  const hashIndex = trimmed.indexOf(' #')
  if (hashIndex !== -1) {
    return trimmed.slice(0, hashIndex).trim()
  }

  return trimmed
}

/**
 * Loads `.env.local` from the project root into `process.env`.
 * Values from the file override empty or missing env vars.
 */
export function loadEnvLocal(options = {}) {
  const cwd = options.cwd ?? process.cwd()
  const envPath = resolve(cwd, '.env.local')

  if (!existsSync(envPath)) {
    return { loaded: false, path: envPath, keys: [] }
  }

  const keys = []

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/u)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separator = trimmed.indexOf('=')
    if (separator === -1) {
      continue
    }

    const key = trimmed.slice(0, separator).trim()
    const value = parseEnvValue(trimmed.slice(separator + 1))

    if (!key) {
      continue
    }

    const current = process.env[key]
    if (options.force || current === undefined || current === '') {
      process.env[key] = value
      keys.push(key)
    }
  }

  return { loaded: true, path: envPath, keys }
}

export function describeMissingNhostEnv() {
  const subdomain = process.env.NHOST_SUBDOMAIN ?? process.env.VITE_NHOST_SUBDOMAIN
  const adminSecret =
    process.env.NHOST_ADMIN_SECRET ?? process.env.CODEGEN_HASURA_ADMIN_SECRET

  const missing = []
  if (!subdomain?.trim()) {
    missing.push('VITE_NHOST_SUBDOMAIN (ou NHOST_SUBDOMAIN)')
  }
  if (!adminSecret?.trim()) {
    missing.push('CODEGEN_HASURA_ADMIN_SECRET (ou NHOST_ADMIN_SECRET)')
  }

  return missing
}

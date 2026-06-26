import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))

export function loadEnvFile(path) {
  if (!existsSync(path)) {
    return
  }

  const content = readFileSync(path, 'utf8')

  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(/\r$/, '').trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env) || process.env[key] === '') {
      process.env[key] = value
    }
  }
}

export function loadRepoEnv() {
  loadEnvFile(resolve(repoRoot, '.env.local'))
  loadEnvFile(resolve(repoRoot, '.env'))
}

function resolveSsl(databaseUrl, explicitSslMode) {
  const sslMode = explicitSslMode ?? new URL(databaseUrl).searchParams.get('sslmode')

  if (sslMode === 'disable') {
    return false
  }

  return { rejectUnauthorized: false }
}

function parseDatabaseUrl(databaseUrl) {
  let parsedUrl

  try {
    parsedUrl = new URL(databaseUrl.replace(/^postgres:\/\//, 'postgresql://'))
  } catch {
    throw new Error('DATABASE_URL invalide (format URL attendu).')
  }

  if (!['postgresql:', 'postgres:'].includes(parsedUrl.protocol)) {
    throw new Error('DATABASE_URL doit utiliser le schéma postgres:// ou postgresql://.')
  }

  const database = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ''))
  if (!database) {
    throw new Error('DATABASE_URL doit inclure un nom de base (/...).')
  }

  const config = {
    host: parsedUrl.hostname,
    port: parsedUrl.port ? Number(parsedUrl.port) : 5432,
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database,
    ssl: resolveSsl(parsedUrl.href, parsedUrl.searchParams.get('sslmode')),
  }

  if (!config.host || !config.user) {
    throw new Error('DATABASE_URL incomplet (host ou user manquant).')
  }

  if (!config.password) {
    throw new Error('Mot de passe absent dans DATABASE_URL.')
  }

  return config
}

function parseDiscreteEnv() {
  const host = process.env.PGHOST?.trim()
  const user = process.env.PGUSER?.trim()
  const database = process.env.PGDATABASE?.trim()
  const password = process.env.PGPASSWORD ?? ''
  const port = process.env.PGPORT?.trim()

  if (!host || !user || !database) {
    return null
  }

  return {
    host,
    port: port ? Number(port) : 5432,
    user,
    password,
    database,
    ssl: process.env.PGSSLMODE?.trim() === 'disable' ? false : { rejectUnauthorized: false },
  }
}

export function resolvePostgresConfig({ explicitUrl } = {}) {
  if (explicitUrl?.trim()) {
    return parseDatabaseUrl(explicitUrl.trim())
  }

  loadRepoEnv()

  const discrete = parseDiscreteEnv()
  if (discrete) {
    if (!discrete.password) {
      throw new Error('PGPASSWORD est vide dans .env.local.')
    }
    return discrete
  }

  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) {
    throw new Error(
      'Connexion Postgres manquante. Définissez PGHOST/PGUSER/PGPASSWORD/PGDATABASE ou DATABASE_URL dans .env.local.',
    )
  }

  if (/%[0-9a-f]{2}/i.test(databaseUrl.split('@')[0] ?? '')) {
    console.warn(
      '[postgres] DATABASE_URL contient des séquences %XX dans le mot de passe — préférez PGPASSWORD (mot de passe brut) pour éviter un décodage incorrect.',
    )
  }

  return parseDatabaseUrl(databaseUrl)
}

export function maskPostgresConfig(config) {
  return {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    password: config.password ? '***' : '(vide)',
    ssl: config.ssl === false ? 'disable' : 'require',
  }
}

export function isSaslAuthError(error) {
  const message = `${error?.message ?? ''} ${error?.code ?? ''}`.toLowerCase()
  return message.includes('sasl') || message.includes('password authentication failed')
}

export function formatPostgresAuthHelp() {
  return `Échec d'authentification Postgres (SASL). Vérifications Nhost :

1. Dashboard → Settings → Database → activer **Public access**
2. Cliquer sur **Reset password** (pas seulement générer un mot de passe)
3. Copier la connection string complète depuis le dashboard
4. Si le mot de passe contient des caractères spéciaux (@, #, %, :, /…), soit :
   - URL-encoder le mot de passe dans DATABASE_URL, soit
   - utiliser des variables séparées dans .env.local :
     PGHOST=...
     PGUSER=postgres
     PGPASSWORD=mot-de-passe-brut
     PGDATABASE=...
     PGPORT=5432
5. Tester : npm run import:off-france -- --check`
}

#!/usr/bin/env node

import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

import {
  installApk,
  isPhoneLikeDevice,
  isWatchDevice,
  listAdbSerials,
} from './adb-device-class.mjs'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const target = process.argv[2] ?? 'both'

const APK_PATHS = {
  phone: path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
  wear: path.join(root, 'android', 'wear', 'build', 'outputs', 'apk', 'debug', 'wear-debug.apk'),
}

function fail(message) {
  console.error(`ÉCHEC : ${message}`)
  process.exit(1)
}

function assemble(modules) {
  execFileSync('./gradlew', modules.map((m) => `:${m}:assembleDebug`), {
    cwd: path.join(root, 'android'),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
}

function ensureApk(kind) {
  const apkPath = APK_PATHS[kind]
  if (!existsSync(apkPath)) {
    assemble([kind === 'phone' ? 'app' : 'wear'])
  }
  if (!existsSync(apkPath)) {
    fail(`APK introuvable : ${apkPath}`)
  }
  return apkPath
}

function installToDevices(kind, predicate) {
  const serials = listAdbSerials()
  const matches = serials.filter(predicate)

  if (matches.length === 0) {
    const label = kind === 'wear' ? 'montre Wear OS' : 'téléphone / tablette'
    fail(`aucun appareil ${label} connecté (adb devices)`)
  }

  const apkPath = ensureApk(kind)

  for (const serial of matches) {
    console.log(`→ Installation ${kind} sur ${serial}`)
    installApk(serial, apkPath)
  }
}

function main() {
  if (!['phone', 'wear', 'both'].includes(target)) {
    fail('usage : node scripts/install-android-debug.mjs <phone|wear|both>')
  }

  console.log(
    'Note : phone et wear partagent applicationId com.rcoach.app — n’utilisez pas installDebug Gradle sans cibler l’appareil.',
  )

  if (target === 'phone' || target === 'both') {
    installToDevices('phone', isPhoneLikeDevice)
  }

  if (target === 'wear' || target === 'both') {
    installToDevices('wear', isWatchDevice)
  }

  console.log('OK : installation terminée.')
}

main()

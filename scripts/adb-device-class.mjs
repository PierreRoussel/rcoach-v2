#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

let cachedAdbPath

/** @returns {string} */
export function resolveAdbPath() {
  if (cachedAdbPath) return cachedAdbPath

  const exe = process.platform === 'win32' ? 'adb.exe' : 'adb'
  const candidates = []

  for (const envVar of ['ANDROID_HOME', 'ANDROID_SDK_ROOT']) {
    const root = process.env[envVar]
    if (root) candidates.push(path.join(root, 'platform-tools', exe))
  }

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA
    if (localAppData) {
      candidates.push(path.join(localAppData, 'Android', 'Sdk', 'platform-tools', exe))
    }
  }

  const home = os.homedir()
  candidates.push(path.join(home, 'Library', 'Android', 'sdk', 'platform-tools', exe))
  candidates.push(path.join(home, 'Android', 'Sdk', 'platform-tools', exe))
  candidates.push(exe)

  const found = candidates.find((candidate) => candidate === exe || existsSync(candidate))
  if (!found || (found !== exe && !existsSync(found))) {
    throw new Error(
      'adb introuvable. Ajoutez Android SDK platform-tools au PATH ou définissez ANDROID_HOME.',
    )
  }

  cachedAdbPath = found
  return cachedAdbPath
}

/** @param {string[]} args @param {import('node:child_process').ExecFileSyncOptionsWithStringEncoding} [options] */
function runAdb(args, options = { encoding: 'utf8' }) {
  return execFileSync(resolveAdbPath(), args, options)
}

/** @returns {string[]} */
export function listAdbSerials() {
  const output = runAdb(['devices', '-l'])
  return output
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && /\bdevice\b/.test(line) && !line.startsWith('List'))
    .map((line) => line.split(/\s+/)[0])
}

/** @param {string} serial */
export function getDeviceCharacteristics(serial) {
  return runAdb(['-s', serial, 'shell', 'getprop', 'ro.build.characteristics']).trim()
}

/** @param {string} serial */
export function isWatchDevice(serial) {
  return getDeviceCharacteristics(serial).includes('watch')
}

/** @param {string} serial */
export function isPhoneLikeDevice(serial) {
  return !isWatchDevice(serial)
}

/** @param {string} serial @param {string} apkPath */
export function installApk(serial, apkPath) {
  execFileSync(resolveAdbPath(), ['-s', serial, 'install', '-r', apkPath], { stdio: 'inherit' })
}

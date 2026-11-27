import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const playRestCompleteBeep = vi.hoisted(() => vi.fn())
const capacitorState = vi.hoisted(() => ({
  isNative: false,
  platform: 'web',
}))
const hapticsVibrate = vi.hoisted(() => vi.fn(async () => undefined))

vi.mock('@/lib/workout/rest-timer-audio', () => ({
  playRestCompleteBeep,
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => capacitorState.isNative,
    getPlatform: () => capacitorState.platform,
  },
}))

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    vibrate: hapticsVibrate,
  },
}))

import {
  HAPTIC_COMPLETE_PATTERN,
  HAPTIC_SOFT_TICK_MS,
  notifyRestComplete,
  notifyRestCountdownTick,
  vibrate,
} from '@/lib/workout/timer-haptics'

describe('timer-haptics', () => {
  const vibrateSpy = vi.fn()

  beforeEach(() => {
    playRestCompleteBeep.mockReset()
    hapticsVibrate.mockClear()
    capacitorState.isNative = false
    capacitorState.platform = 'web'
    vibrateSpy.mockReset()
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { vibrate: vibrateSpy },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('vibrate no-op when navigator.vibrate absent', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {},
    })
    await expect(vibrate(HAPTIC_SOFT_TICK_MS)).resolves.toBeUndefined()
    expect(hapticsVibrate).not.toHaveBeenCalled()
  })

  it('web fallback uses navigator.vibrate pattern', async () => {
    await vibrate(HAPTIC_COMPLETE_PATTERN)
    expect(vibrateSpy).toHaveBeenCalledWith(HAPTIC_COMPLETE_PATTERN)
    expect(hapticsVibrate).not.toHaveBeenCalled()
  })

  it('android native uses Capacitor Haptics sequence', async () => {
    capacitorState.isNative = true
    capacitorState.platform = 'android'
    await vibrate([50, 40, 50])
    expect(hapticsVibrate).toHaveBeenCalledWith({ duration: 50 })
    expect(hapticsVibrate).toHaveBeenCalledTimes(2)
  })

  it('notifyRestComplete plays beep + complete pattern', async () => {
    notifyRestComplete()
    expect(playRestCompleteBeep).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => {
      expect(vibrateSpy).toHaveBeenCalledWith(HAPTIC_COMPLETE_PATTERN)
    })
  })

  it('notifyRestCountdownTick soft vibrates', async () => {
    notifyRestCountdownTick(2)
    await vi.waitFor(() => {
      expect(vibrateSpy).toHaveBeenCalledWith(HAPTIC_SOFT_TICK_MS)
    })
  })
})

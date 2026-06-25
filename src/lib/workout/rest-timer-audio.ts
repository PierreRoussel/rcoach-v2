type CountdownSecond = 3 | 2 | 1

const COUNTDOWN_FREQUENCIES: Record<CountdownSecond, number> = {
  3: 520,
  2: 660,
  1: 820,
}

let audioContext: AudioContext | null = null

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null
  }

  const AudioContextClass =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioContextClass) {
    return null
  }

  return new AudioContextClass()
}

async function ensureAudioContext(): Promise<AudioContext | null> {
  if (!audioContext) {
    audioContext = createAudioContext()
  }

  if (!audioContext) {
    return null
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }

  return audioContext
}

function playTone(
  context: AudioContext,
  frequency: number,
  durationMs: number,
  volume = 0.28,
) {
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = 'triangle'
  oscillator.frequency.value = frequency
  oscillator.connect(gain)
  gain.connect(context.destination)

  const startAt = context.currentTime
  const durationSeconds = durationMs / 1000
  const attackSeconds = 0.02
  const releaseStart = startAt + durationSeconds - 0.04

  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(volume, startAt + attackSeconds)
  gain.gain.setValueAtTime(volume, Math.max(startAt + attackSeconds, releaseStart))
  gain.gain.linearRampToValueAtTime(0, startAt + durationSeconds)

  oscillator.start(startAt)
  oscillator.stop(startAt + durationSeconds + 0.05)
}

export async function warmUpRestTimerAudio() {
  const context = await ensureAudioContext()
  if (!context) {
    return
  }

  const buffer = context.createBuffer(1, 1, context.sampleRate)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start()
}

export function resetRestTimerAudioSession() {
  if (!audioContext) {
    return
  }

  void audioContext.close()
  audioContext = null
}

export async function playRestCountdownBeep(second: CountdownSecond) {
  const context = await ensureAudioContext()
  if (!context) {
    return
  }

  playTone(context, COUNTDOWN_FREQUENCIES[second], 220, 0.3)
}

export async function playRestCompleteBeep() {
  const context = await ensureAudioContext()
  if (!context) {
    return
  }

  playTone(context, 880, 180, 0.32)
  window.setTimeout(() => {
    if (!audioContext) {
      return
    }

    playTone(audioContext, 1046, 220, 0.34)
  }, 150)
}

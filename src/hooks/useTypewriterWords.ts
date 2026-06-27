import { useEffect, useState } from 'react'

const DEFAULT_MS_PER_WORD = 42

function splitWords(text: string) {
  if (!text.trim()) {
    return [] as string[]
  }

  return text.split(/\s+/).filter(Boolean)
}

export function useTypewriterWords(text: string, msPerWord = DEFAULT_MS_PER_WORD) {
  const [visibleCount, setVisibleCount] = useState(0)
  const words = splitWords(text)

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setVisibleCount(words.length)
      return
    }

    setVisibleCount(0)
    if (words.length === 0) {
      return
    }

    let index = 0
    let frameId = 0
    let lastTick = 0

    const tick = (timestamp: number) => {
      if (lastTick === 0) {
        lastTick = timestamp
      }

      const elapsed = timestamp - lastTick
      if (elapsed >= msPerWord) {
        index += 1
        setVisibleCount(index)
        lastTick = timestamp
      }

      if (index < words.length) {
        frameId = window.requestAnimationFrame(tick)
      }
    }

    frameId = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [msPerWord, text, words.length])

  const visibleText = words.slice(0, visibleCount).join(' ')
  const isComplete = visibleCount >= words.length

  return { visibleText, isComplete, wordCount: words.length }
}

import { describe, expect, it } from 'vitest'

import {
  removeThinInkStrokes,
  removeVerticalColumnHairlines,
} from '@/lib/nutrition/label-scan/label-image-cleanup'

function createImage(width: number, height: number, ink: Array<{ x: number; y: number }>) {
  const data = new Uint8ClampedArray(width * height * 4).fill(255)
  for (const pixel of ink) {
    const index = (pixel.y * width + pixel.x) * 4
    data[index] = 0
    data[index + 1] = 0
    data[index + 2] = 0
  }
  return data
}

describe('removeThinInkStrokes', () => {
  it('removes a 2x36 vertical stroke', () => {
    const width = 40
    const height = 40
    const ink = []
    for (let y = 2; y < 38; y += 1) {
      ink.push({ x: 10, y }, { x: 11, y })
    }
    const data = createImage(width, height, ink)

    removeThinInkStrokes(data, width, height)

    for (let y = 2; y < 38; y += 1) {
      expect(data[((y * width + 10) * 4)]).toBe(255)
      expect(data[((y * width + 11) * 4)]).toBe(255)
    }
  })

  it('keeps wider text strokes', () => {
    const width = 40
    const height = 20
    const ink = []
    for (let y = 5; y < 15; y += 1) {
      for (let x = 8; x < 20; x += 1) {
        ink.push({ x, y })
      }
    }
    const data = createImage(width, height, ink)

    removeThinInkStrokes(data, width, height)

    expect(data[((8 * width + 8) * 4)]).toBe(0)
    expect(data[((10 * width + 12) * 4)]).toBe(0)
  })
})

describe('removeVerticalColumnHairlines', () => {
  it('removes an isolated vertical table border column', () => {
    const width = 30
    const height = 40
    const ink = []
    for (let y = 0; y < height; y += 1) {
      ink.push({ x: 12, y })
    }
    const data = createImage(width, height, ink)

    removeVerticalColumnHairlines(data, width, height)

    for (let y = 0; y < height; y += 1) {
      expect(data[((y * width + 12) * 4)]).toBe(255)
    }
  })
})

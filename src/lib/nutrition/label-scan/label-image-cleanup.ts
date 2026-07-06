const BINARY_THRESHOLD = 148

function isInk(data: Uint8ClampedArray, width: number, x: number, y: number): boolean {
  const index = (y * width + x) * 4
  return data[index] < BINARY_THRESHOLD
}

function erasePixel(data: Uint8ClampedArray, width: number, x: number, y: number): void {
  const index = (y * width + x) * 4
  data[index] = 255
  data[index + 1] = 255
  data[index + 2] = 255
}

function shouldRemoveInkComponent(componentWidth: number, componentHeight: number): boolean {
  const area = componentWidth * componentHeight
  const aspectRatio =
    componentWidth > 0 ? componentHeight / componentWidth : componentHeight

  if (area <= 48) {
    return true
  }

  if (componentWidth <= 8 && componentHeight >= 6 && aspectRatio >= 2.5) {
    return true
  }

  if (componentHeight <= 4 && componentWidth >= 12 && componentWidth / Math.max(componentHeight, 1) >= 4) {
    return true
  }

  return false
}

export function removeVerticalColumnHairlines(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  const columnInk = new Array(width).fill(0)
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      if (isInk(data, width, x, y)) {
        columnInk[x] += 1
      }
    }
  }

  let x = 0
  while (x < width) {
    const density = columnInk[x] / height
    if (density < 0.02) {
      x += 1
      continue
    }

    let runEnd = x
    while (runEnd + 1 < width && columnInk[runEnd + 1] / height >= 0.02) {
      runEnd += 1
    }

    const runWidth = runEnd - x + 1
    const runDensity =
      columnInk.slice(x, runEnd + 1).reduce((sum, value) => sum + value, 0) /
      (height * runWidth)

    let neighborInk = 0
    let neighborColumns = 0
    for (const column of [x - 3, x - 2, x - 1, runEnd + 1, runEnd + 2, runEnd + 3]) {
      if (column < 0 || column >= width) {
        continue
      }
      neighborColumns += 1
      neighborInk += columnInk[column]
    }

    const neighborDensity =
      neighborColumns > 0 ? neighborInk / (height * neighborColumns) : 0

    if (runWidth <= 4 && runDensity >= 0.2 && neighborDensity < runDensity * 0.35) {
      for (let column = x; column <= runEnd; column += 1) {
        for (let y = 0; y < height; y += 1) {
          erasePixel(data, width, column, y)
        }
      }
    }

    x = runEnd + 1
  }
}

export function removeThinInkStrokes(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  const visited = new Uint8Array(width * height)

  for (let startY = 0; startY < height; startY += 1) {
    for (let startX = 0; startX < width; startX += 1) {
      const startIndex = startY * width + startX
      if (visited[startIndex] || !isInk(data, width, startX, startY)) {
        continue
      }

      const pixels: Array<{ x: number; y: number }> = []
      const stack = [{ x: startX, y: startY }]
      let minX = startX
      let maxX = startX
      let minY = startY
      let maxY = startY

      while (stack.length > 0) {
        const { x, y } = stack.pop()!
        const index = y * width + x
        if (x < 0 || y < 0 || x >= width || y >= height || visited[index] || !isInk(data, width, x, y)) {
          continue
        }

        visited[index] = 1
        pixels.push({ x, y })
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)

        stack.push(
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 },
        )
      }

      const componentWidth = maxX - minX + 1
      const componentHeight = maxY - minY + 1

      if (!shouldRemoveInkComponent(componentWidth, componentHeight)) {
        continue
      }

      for (const pixel of pixels) {
        erasePixel(data, width, pixel.x, pixel.y)
      }
    }
  }
}

export function sanitizeLabelImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  removeThinInkStrokes(data, width, height)
  removeVerticalColumnHairlines(data, width, height)
  removeThinInkStrokes(data, width, height)
}

export function addWhiteBorder(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  border: number,
): { data: Uint8ClampedArray; width: number; height: number } {
  const nextWidth = width + border * 2
  const nextHeight = height + border * 2
  const next = new Uint8ClampedArray(nextWidth * nextHeight * 4).fill(255)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = (y * width + x) * 4
      const targetIndex = ((y + border) * nextWidth + (x + border)) * 4
      next[targetIndex] = data[sourceIndex]
      next[targetIndex + 1] = data[sourceIndex + 1]
      next[targetIndex + 2] = data[sourceIndex + 2]
      next[targetIndex + 3] = 255
    }
  }

  return { data: next, width: nextWidth, height: nextHeight }
}

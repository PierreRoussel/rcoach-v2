import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'

export const CIQUAL_NUTRIENT_CODES = {
  calories: '328',
  protein: '25000',
  carbs: '31000',
  fat: '40000',
  salt: '10004',
  sugar: '32000',
  saturatedFat: '40302',
}

const REQUIRED_NUTRIENT_CODES = new Set([
  CIQUAL_NUTRIENT_CODES.calories,
  CIQUAL_NUTRIENT_CODES.protein,
  CIQUAL_NUTRIENT_CODES.carbs,
  CIQUAL_NUTRIENT_CODES.fat,
])

export function parseXmlTagValue(block, tagName) {
  if (new RegExp(`<${tagName}\\s+missing`).test(block)) {
    return null
  }

  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`))
  if (!match) {
    return null
  }

  const value = match[1].trim()
  return value.length > 0 ? value : null
}

export async function readXmlBlocks(filePath, blockTag) {
  const contents = await readFile(filePath, 'utf8')
  return extractXmlBlocks(contents, blockTag)
}

export function extractXmlBlocks(contents, blockTag) {
  const openTag = `<${blockTag}>`
  const closeTag = `</${blockTag}>`
  const blocks = []
  let cursor = 0

  while (cursor < contents.length) {
    const start = contents.indexOf(openTag, cursor)
    if (start === -1) {
      break
    }

    const end = contents.indexOf(closeTag, start)
    if (end === -1) {
      break
    }

    blocks.push(contents.slice(start, end + closeTag.length))
    cursor = end + closeTag.length
  }

  return blocks
}

export async function* streamXmlBlocks(filePath, blockTag) {
  const openTag = `<${blockTag}>`
  const closeTag = `</${blockTag}>`
  const stream = createReadStream(filePath, { encoding: 'utf8' })

  let buffer = ''

  for await (const chunk of stream) {
    buffer += chunk

    let start = buffer.indexOf(openTag)
    while (start !== -1) {
      const end = buffer.indexOf(closeTag, start)
      if (end === -1) {
        break
      }

      yield buffer.slice(start, end + closeTag.length)
      buffer = buffer.slice(end + closeTag.length)
      start = buffer.indexOf(openTag)
    }

    if (buffer.length > 2_000_000) {
      buffer = buffer.slice(-openTag.length)
    }
  }
}

export function parseAlimBlock(block) {
  const code = parseXmlTagValue(block, 'alim_code')
  const name = parseXmlTagValue(block, 'alim_nom_fr')

  if (!code || !name) {
    return null
  }

  return {
    alimCode: code.replace(/\s+/g, ''),
    name: name.replace(/\s+/g, ' ').trim(),
  }
}

export function parseCompoBlock(block) {
  const alimCode = parseXmlTagValue(block, 'alim_code')?.replace(/\s+/g, '')
  const constCode = parseXmlTagValue(block, 'const_code')?.replace(/\s+/g, '')
  const rawTeneur = parseXmlTagValue(block, 'teneur')

  if (!alimCode || !constCode || rawTeneur == null) {
    return null
  }

  const numeric = Number(rawTeneur.replace(',', '.'))
  if (!Number.isFinite(numeric)) {
    return null
  }

  return { alimCode, constCode, value: numeric }
}

export function isRequiredNutrientCode(constCode) {
  return REQUIRED_NUTRIENT_CODES.has(constCode)
}

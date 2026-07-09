/** Tuiles SVG `public/badges/tiles/{key}.svg` générées depuis `sheet-sports-candy.svg`. */
export const BADGE_SPRITE_SRC = '/badges/sources/sheet-sports-candy.svg' as const
export const BADGE_SPRITE_SIZE = 1024
export const BADGE_TILE_DIR = '/badges/tiles' as const

export type BadgeViewBox = {
  x: number
  y: number
  w: number
  h: number
}

const BADGE_ASSET_KEYS = [
  'nutrition_streak_7',
  'nutrition_streak_30',
  'nutrition_streak_100',
  'workout_streak_4',
  'workout_streak_12',
  'workout_streak_52',
  'sessions_10',
  'sessions_50',
  'sessions_100',
  'sessions_365',
  'first_pr',
  'pr_10',
  'pr_50',
  'volume_10k',
  'volume_100k',
  'volume_1m',
] as const

export type BadgeAssetKey = (typeof BADGE_ASSET_KEYS)[number]

/** Gardé pour le script `generate-badge-tiles.py`. */
export const BADGE_VIEW_BOXES: Record<BadgeAssetKey, BadgeViewBox> = {
  nutrition_streak_7: { x: 55, y: 52, w: 201, h: 202 },
  nutrition_streak_30: { x: 256, y: 62, w: 256, h: 179 },
  nutrition_streak_100: { x: 523, y: 62, w: 236, h: 181 },
  workout_streak_4: { x: 793, y: 42, w: 184, h: 214 },
  workout_streak_12: { x: 45, y: 291, w: 211, h: 221 },
  workout_streak_52: { x: 256, y: 264, w: 256, h: 244 },
  sessions_10: { x: 530, y: 301, w: 238, h: 189 },
  sessions_50: { x: 768, y: 256, w: 239, h: 231 },
  sessions_100: { x: 48, y: 511, w: 248, h: 244 },
  sessions_365: { x: 300, y: 500, w: 192, h: 264 },
  first_pr: { x: 543, y: 519, w: 206, h: 225 },
  pr_10: { x: 779, y: 518, w: 213, h: 233 },
  pr_50: { x: 52, y: 771, w: 204, h: 227 },
  volume_10k: { x: 330, y: 776, w: 154, h: 218 },
  volume_100k: { x: 544, y: 769, w: 204, h: 222 },
  volume_1m: { x: 784, y: 773, w: 201, h: 225 },
}

const BADGE_ASSET_KEY_SET = new Set<string>(BADGE_ASSET_KEYS)

export function hasBadgeAsset(key: string) {
  return BADGE_ASSET_KEY_SET.has(key)
}

export function getBadgeViewBox(key: string): BadgeViewBox | null {
  if (!hasBadgeAsset(key)) {
    return null
  }

  return BADGE_VIEW_BOXES[key as BadgeAssetKey]
}

export function getBadgeTileSrc(key: string) {
  if (!hasBadgeAsset(key)) {
    return null
  }

  return `${BADGE_TILE_DIR}/${key}.svg`
}

/** @deprecated Utiliser `getBadgeTileSrc`. */
export function getBadgeAssetSrc(key: string) {
  return getBadgeTileSrc(key)
}
